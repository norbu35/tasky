#!/usr/bin/env python3
"""
Unegui.mn service-listing scraper for Tasky market research.

Collects service listings (cleaning, moving, plumbing, etc.) from Mongolia's
dominant classifieds site to feed Phase 1 supply acquisition and category
prioritisation.

Usage:
    # Probe mode — dump raw HTML for one page to inspect selectors:
    python3 scripts/scrape-unegui.py --probe --categories cleaning

    # Full scrape for two categories, UB only, max 10 pages each:
    python3 scripts/scrape-unegui.py \\
        --categories cleaning,moving \\
        --location ulan-bator \\
        --max-pages 10 \\
        --output data/unegui/

    # Incremental (cron) — only fetch new listings since last run:
    python3 scripts/scrape-unegui.py \\
        --categories cleaning,moving,plumbing,electrical,painting,construction \\
        --location ulan-bator \\
        --max-pages 5 \\
        --output data/unegui/ \\
        --mode incremental
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import hashlib
import logging
import os
import random
import re
import sys
import time
from datetime import date, datetime, timezone
from glob import glob
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://www.unegui.mn"

CATEGORIES: dict[str, str] = {
    "cleaning": "/jlchilgee/bh-tseverlegee/",
    "moving": "/jlchilgee/-nlgeltteever/",
    "plumbing": "/jlchilgee/barilgyin-bh-azhil/santehnik/",
    "electrical": "/jlchilgee/barilgyin-bh-azhil/tsahilgaan/",
    "painting": "/jlchilgee/barilgyin-bh-azhil/zasal-chimeglel/",
    "construction": "/jlchilgee/barilgyin-bh-azhil/",
}

# CSS selectors — calibrated against live Unegui.mn HTML (March 2026).
SELECTORS = {
    # Each listing card is a div.advert-grid with a data-id attribute.
    "listing_card": "div.advert-grid[data-id]",
    # Within a card:
    "title": "a.advert-grid__content-title",
    "price": "a.advert-grid__content-price",
    "location": "span.advert-grid__content-place",
    "date": "span.advert-grid__content-date",
    "link": "a.advert-grid__content-title",
    # Pagination
    "next_page": "a.number-list-next",
}

# Candidate CSS selectors for the phone-reveal button on detail pages.
# Ordered by specificity — first match wins. Calibrate via --probe-detail.
PHONE_REVEAL_SELECTORS = [
    "button[class*='phone']",
    "a[class*='phone']",
    "div[class*='phone']",
    "[data-event-name*='phone']",
    "[data-event-name*='contact']",
    ".js-phone-show",
    ".js-show-phone",
    ".show-phone",
]

# Regex patterns for Mongolian phone numbers (8 digits, starting 6-9).
PHONE_PATTERNS = [
    re.compile(r"\b[6-9]\d{3}[\s-]?\d{4}\b"),
    re.compile(r"\b\d{4}[\s-]?\d{4}\b"),
]

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "mn,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://www.unegui.mn/",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

DELAY_MIN = 2.0
DELAY_MAX = 5.0
MAX_RETRIES = 3

CSV_COLUMNS = [
    "id",
    "title",
    "price",
    "price_raw",
    "currency",
    "description",
    "location",
    "district",
    "date_posted",
    "date_scraped",
    "category",
    "subcategory",
    "url",
    "phone_visible",
    "phone",
]

log = logging.getLogger("unegui-scraper")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _listing_id(url: str) -> str:
    """Derive a stable ID from a listing URL."""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def _parse_price(text: str | None) -> tuple[str, str, str]:
    """Return (normalised_price, raw_text, currency).

    Handles formats like "50,000₮", "2,000₮3,000₮" (range), "Үнэ тохирно"
    (negotiable). For ranges, returns the first (lower) price.
    """
    if not text:
        return ("", "", "")
    raw = text.strip()
    currency = "MNT"
    if "$" in raw or "USD" in raw.upper():
        currency = "USD"
    # Extract all number groups (handles ranges like "2,000₮3,000₮")
    numbers = re.findall(r"[\d,]+", raw)
    if not numbers:
        return ("", raw, currency)
    # Take the first number, strip comma separators
    price = numbers[0].replace(",", "")
    return (price, raw, currency)


def _build_url(category_path: str, location: str | None, page: int) -> str:
    path = category_path
    if location:
        path = path.rstrip("/") + f"/{location}/"
    url = BASE_URL + path
    if page > 1:
        url += f"?page={page}"
    return url


def _load_seen_urls(output_dir: str, category: str) -> set[str]:
    """Load URLs already collected in previous CSVs for this category."""
    seen: set[str] = set()
    pattern = os.path.join(output_dir, f"{category}_*.csv")
    for filepath in glob(pattern):
        try:
            with open(filepath, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    url = row.get("url", "")
                    if url:
                        seen.add(url)
        except Exception:
            log.warning("Could not read existing CSV %s", filepath)
    return seen


def _latest_date_posted(output_dir: str, category: str) -> str | None:
    """Return the most recent date_posted value from existing CSVs."""
    pattern = os.path.join(output_dir, f"{category}_*.csv")
    latest: str | None = None
    for filepath in sorted(glob(pattern), reverse=True):
        try:
            with open(filepath, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    dp = row.get("date_posted", "")
                    if dp and (latest is None or dp > latest):
                        latest = dp
        except Exception:
            continue
    return latest


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------


def _fetch(session: requests.Session, url: str) -> requests.Response | None:
    """Fetch a URL with retries and exponential backoff."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, headers=REQUEST_HEADERS, timeout=30)
            if resp.status_code == 200:
                return resp
            if resp.status_code in (429, 503):
                wait = 2**attempt + random.random()
                log.warning(
                    "HTTP %d for %s — retrying in %.1fs (attempt %d/%d)",
                    resp.status_code,
                    url,
                    wait,
                    attempt,
                    MAX_RETRIES,
                )
                time.sleep(wait)
                continue
            if resp.status_code == 403:
                log.warning(
                    "HTTP 403 for %s — site may be blocking automated requests. "
                    "Skipping.",
                    url,
                )
                return None
            log.warning("HTTP %d for %s — skipping", resp.status_code, url)
            return None
        except requests.RequestException as exc:
            wait = 2**attempt + random.random()
            log.warning(
                "Request error for %s: %s — retrying in %.1fs (attempt %d/%d)",
                url,
                exc,
                wait,
                attempt,
                MAX_RETRIES,
            )
            time.sleep(wait)
    log.error("Failed to fetch %s after %d attempts", url, MAX_RETRIES)
    return None


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------


def _parse_listings(html: str, category: str) -> list[dict[str, Any]]:
    """Extract listing data from a search-results page."""
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(SELECTORS["listing_card"])
    listings: list[dict[str, Any]] = []

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for card in cards:
        # Title & URL
        link_el = card.select_one(SELECTORS["link"])
        if not link_el:
            continue
        title = link_el.get_text(strip=True)
        href = link_el.get("href", "")
        url = urljoin(BASE_URL, href) if href else ""
        if not url:
            continue

        # Price — from the price link text (e.g. "50,000 ₮" or "Үнэ тохирно")
        price_el = card.select_one(SELECTORS["price"])
        raw_price = price_el.get_text(strip=True) if price_el else None
        price, price_raw, currency = _parse_price(raw_price)

        # Location / district (e.g. "УБ — Сүхбаатар, 100 айл")
        loc_el = card.select_one(SELECTORS["location"])
        location_text = loc_el.get_text(strip=True) if loc_el else ""
        district = ""
        if location_text:
            # Format: "УБ — District, Sub-area" — split on dash then comma
            after_dash = location_text.split("—")[-1].strip() if "—" in location_text else location_text
            parts = [p.strip() for p in after_dash.split(",")]
            district = parts[0] if parts else ""

        # Date posted (e.g. "2 өдрийн өмнө")
        date_el = card.select_one(SELECTORS["date"])
        date_posted = date_el.get_text(strip=True) if date_el else ""

        # Phone visibility (some templates show a phone icon)
        phone_visible = "yes" if card.select_one("[class*='phone']") else "no"

        listings.append(
            {
                "id": card.get("data-id", _listing_id(url)),
                "title": title,
                "price": price,
                "price_raw": price_raw,
                "currency": currency,
                "description": "",
                "location": location_text,
                "district": district,
                "date_posted": date_posted,
                "date_scraped": now,
                "category": category,
                "subcategory": "",
                "url": url,
                "phone_visible": phone_visible,
                "phone": "",
            }
        )

    return listings


def _has_next_page(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    return soup.select_one(SELECTORS["next_page"]) is not None


# ---------------------------------------------------------------------------
# Phone number extraction (Playwright)
# ---------------------------------------------------------------------------


def _extract_phone(text: str) -> str:
    """Extract the first Mongolian phone number from text."""
    for pattern in PHONE_PATTERNS:
        m = pattern.search(text)
        if m:
            return m.group().replace(" ", "").replace("-", "")
    return ""


async def _fetch_phone_single(
    page: Any,
    url: str,
    listing_index: int,
    total: int,
) -> str:
    """Navigate to a detail page, click the phone reveal button, extract the phone number."""
    captured_phones: list[str] = []

    def _intercept_response(response: Any) -> None:
        """Capture phone numbers from XHR responses."""
        if response.request.resource_type in ("xhr", "fetch"):
            try:
                # Use synchronous approach — schedule coroutine
                asyncio.ensure_future(_check_response(response))
            except Exception:
                pass

    async def _check_response(response: Any) -> None:
        try:
            body = await response.text()
            phone = _extract_phone(body)
            if phone:
                captured_phones.append(phone)
        except Exception:
            pass

    page.on("response", _intercept_response)
    try:
        log.info("  [%d/%d] Fetching phone from %s", listing_index, total, url)
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        # Wait for Cloudflare challenge to resolve — look for main content
        try:
            await page.wait_for_selector(
                "body:not(:has(#challenge-running))", timeout=15000
            )
        except Exception:
            log.warning("  [%d/%d] Cloudflare challenge may not have resolved", listing_index, total)

        # Try each candidate selector for the phone reveal button
        clicked = False
        for selector in PHONE_REVEAL_SELECTORS:
            try:
                btn = await page.query_selector(selector)
                if btn and await btn.is_visible():
                    await btn.click()
                    clicked = True
                    log.debug("  Clicked phone button: %s", selector)
                    break
            except Exception:
                continue

        if not clicked:
            log.debug("  [%d/%d] No phone reveal button found", listing_index, total)

        # Wait briefly for phone to appear (DOM update or XHR)
        await asyncio.sleep(1.5)

        # Strategy 1: check captured XHR responses
        if captured_phones:
            log.debug("  Phone from XHR: %s", captured_phones[0])
            return captured_phones[0]

        # Strategy 2: scan the page DOM for phone numbers
        body_text = await page.inner_text("body")
        phone = _extract_phone(body_text)
        if phone:
            log.debug("  Phone from DOM: %s", phone)
            return phone

        log.debug("  [%d/%d] No phone number found", listing_index, total)
        return ""
    except Exception as exc:
        log.warning("  [%d/%d] Error fetching phone: %s", listing_index, total, exc)
        return ""
    finally:
        page.remove_listener("response", _intercept_response)


async def _fetch_phones_batch(
    listings: list[dict[str, Any]],
    concurrency: int = 1,
) -> None:
    """Enrich listings with phone numbers using Playwright."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log.error(
            "playwright is not installed. "
            "Install it with: pip install playwright && playwright install chromium"
        )
        return

    total = len(listings)
    log.info("Fetching phone numbers for %d listings (concurrency=%d)...", total, concurrency)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=REQUEST_HEADERS["User-Agent"],
            locale="mn-MN",
            java_script_enabled=True,
        )
        # Disable navigator.webdriver to reduce bot detection
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        semaphore = asyncio.Semaphore(concurrency)

        async def _process(listing: dict[str, Any], idx: int) -> None:
            async with semaphore:
                page = await context.new_page()
                try:
                    phone = await _fetch_phone_single(page, listing["url"], idx, total)
                    listing["phone"] = phone
                finally:
                    await page.close()
                # Polite delay between requests
                delay = random.uniform(DELAY_MIN, DELAY_MAX)
                await asyncio.sleep(delay)

        tasks = [_process(listing, i + 1) for i, listing in enumerate(listings)]
        await asyncio.gather(*tasks)

        await context.close()
        await browser.close()

    phones_found = sum(1 for l in listings if l.get("phone"))
    log.info("Phone fetching complete: %d/%d numbers found.", phones_found, total)


async def _probe_detail(category: str, location: str | None) -> None:
    """Open one detail page in Playwright and dump rendered HTML for selector calibration."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log.error(
            "playwright is not installed. "
            "Install it with: pip install playwright && playwright install chromium"
        )
        sys.exit(1)

    # First, fetch a category page with requests to get one listing URL
    session = requests.Session()
    path = CATEGORIES[category]
    url = _build_url(path, location, page=1)
    log.info("Fetching category page to find a listing URL: %s", url)
    resp = _fetch(session, url)
    if resp is None:
        log.error("Could not fetch category page.")
        sys.exit(1)

    listings = _parse_listings(resp.text, category)
    if not listings:
        log.error("No listings found on category page.")
        sys.exit(1)

    detail_url = listings[0]["url"]
    log.info("Opening detail page in Playwright: %s", detail_url)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=REQUEST_HEADERS["User-Agent"],
            locale="mn-MN",
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        page = await context.new_page()
        await page.goto(detail_url, wait_until="domcontentloaded", timeout=30000)

        # Wait for Cloudflare to resolve
        try:
            await page.wait_for_selector(
                "body:not(:has(#challenge-running))", timeout=15000
            )
        except Exception:
            log.warning("Cloudflare challenge may not have resolved.")

        # Dump rendered HTML
        html = await page.content()
        print(html)

        await page.close()
        await context.close()
        await browser.close()


# ---------------------------------------------------------------------------
# Scraping orchestration
# ---------------------------------------------------------------------------


def scrape_category(
    session: requests.Session,
    category: str,
    location: str | None,
    max_pages: int,
    output_dir: str,
    incremental: bool,
) -> list[dict[str, Any]]:
    """Scrape one category and return all collected listings."""
    path = CATEGORIES[category]
    seen = _load_seen_urls(output_dir, category)
    cutoff_date = _latest_date_posted(output_dir, category) if incremental else None
    all_listings: list[dict[str, Any]] = []
    hit_old = False

    log.info(
        "Scraping category=%s location=%s max_pages=%d incremental=%s",
        category,
        location or "(all)",
        max_pages,
        incremental,
    )
    if cutoff_date:
        log.info("  Incremental cutoff: %s", cutoff_date)

    for page in range(1, max_pages + 1):
        url = _build_url(path, location, page)
        log.info("  Page %d: %s", page, url)

        resp = _fetch(session, url)
        if resp is None:
            break

        listings = _parse_listings(resp.text, category)
        if not listings:
            log.info("  No listings found on page %d — stopping.", page)
            break

        new_count = 0
        for listing in listings:
            if listing["url"] in seen:
                continue
            # In incremental mode, stop when we hit old listings
            if incremental and cutoff_date and listing["date_posted"] < cutoff_date:
                hit_old = True
                continue
            seen.add(listing["url"])
            all_listings.append(listing)
            new_count += 1

        log.info("  Extracted %d new listings from page %d", new_count, page)

        if hit_old:
            log.info("  Reached previously-scraped listings — stopping.")
            break

        if not _has_next_page(resp.text):
            log.info("  No next page link — stopping.")
            break

        # Polite delay
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        log.debug("  Sleeping %.1fs", delay)
        time.sleep(delay)

    log.info("  Total new listings for %s: %d", category, len(all_listings))
    return all_listings


def write_csv(listings: list[dict[str, Any]], output_dir: str, category: str) -> str:
    """Write listings to a dated CSV file. Returns the file path."""
    os.makedirs(output_dir, exist_ok=True)
    today = date.today().isoformat()
    filepath = os.path.join(output_dir, f"{category}_{today}.csv")

    # If the file already exists (incremental append), read existing rows first
    existing: list[dict[str, Any]] = []
    if os.path.exists(filepath):
        with open(filepath, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            existing = list(reader)

    all_rows = existing + listings
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(all_rows)

    return filepath


# ---------------------------------------------------------------------------
# Probe mode
# ---------------------------------------------------------------------------


def probe(session: requests.Session, category: str, location: str | None) -> None:
    """Fetch a single page and dump raw HTML for selector inspection."""
    path = CATEGORIES[category]
    url = _build_url(path, location, page=1)
    log.info("Probing %s", url)
    resp = _fetch(session, url)
    if resp is None:
        log.error("Probe failed — could not fetch %s", url)
        sys.exit(1)
    print(resp.text)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Scrape service listings from Unegui.mn for Tasky market research."
    )
    p.add_argument(
        "--categories",
        default="cleaning,moving,plumbing,electrical,painting,construction",
        help="Comma-separated category keys (default: all).",
    )
    p.add_argument(
        "--location",
        default=None,
        help="Location slug to filter by, e.g. 'ulan-bator' (default: none).",
    )
    p.add_argument(
        "--max-pages",
        type=int,
        default=10,
        help="Maximum pages to scrape per category (default: 10).",
    )
    p.add_argument(
        "--output",
        default="data/unegui/",
        help="Output directory for CSV files (default: data/unegui/).",
    )
    p.add_argument(
        "--mode",
        choices=["full", "incremental"],
        default="full",
        help="Scrape mode: 'full' (re-scrape everything) or 'incremental' (default: full).",
    )
    p.add_argument(
        "--probe",
        action="store_true",
        help="Probe mode: fetch one category page and dump raw HTML to stdout.",
    )
    p.add_argument(
        "--fetch-phones",
        action="store_true",
        help="After scraping listings, fetch phone numbers from detail pages using Playwright.",
    )
    p.add_argument(
        "--phone-concurrency",
        type=int,
        default=1,
        help="Number of concurrent browser pages for phone fetching (default: 1, max recommended: 3).",
    )
    p.add_argument(
        "--probe-detail",
        action="store_true",
        help="Probe detail mode: open one listing detail page in Playwright and dump rendered HTML.",
    )
    p.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable debug logging.",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    cats = [c.strip() for c in args.categories.split(",") if c.strip()]
    invalid = [c for c in cats if c not in CATEGORIES]
    if invalid:
        log.error(
            "Unknown categories: %s. Valid: %s",
            ", ".join(invalid),
            ", ".join(CATEGORIES),
        )
        sys.exit(1)

    if args.probe_detail:
        asyncio.run(_probe_detail(cats[0], args.location))
        return

    session = requests.Session()

    if args.probe:
        probe(session, cats[0], args.location)
        return

    incremental = args.mode == "incremental"
    total = 0

    for cat in cats:
        listings = scrape_category(
            session=session,
            category=cat,
            location=args.location,
            max_pages=args.max_pages,
            output_dir=args.output,
            incremental=incremental,
        )
        if listings:
            if args.fetch_phones:
                asyncio.run(
                    _fetch_phones_batch(listings, concurrency=args.phone_concurrency)
                )
            path = write_csv(listings, args.output, cat)
            log.info("Wrote %d listings to %s", len(listings), path)
            total += len(listings)
        else:
            log.info("No new listings for category '%s'.", cat)

    log.info("Done. Total new listings across all categories: %d", total)


if __name__ == "__main__":
    main()
