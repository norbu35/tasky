# Unegui.mn Domestic Services Market Report

**Data source:** unegui.mn scraped 2026-03-03 | 6 service categories | 2,374 listings

---

## 1. Market Size & Category Breakdown

| Category     | Listings | % of Total | Daily Rate (last 30d) |
| ------------ | -------- | ---------- | --------------------- |
| Construction | 600\*    | 25.3%      | 16.7/day              |
| Painting     | 600\*    | 25.3%      | 8.9/day               |
| Moving       | 513      | 21.6%      | 7.8/day               |
| Plumbing     | 398      | 16.8%      | 5.9/day               |
| Cleaning     | 147      | 6.2%       | 1.8/day               |
| Electrical   | 116      | 4.9%       | 1.6/day               |

_\*Hit 600-listing scraper cap -- actual supply is larger._

Overall velocity: **~43 listings/day** (last 30 days), spiking to **~143/day** in the last week of February, signaling
the start of spring renovation season.

**Monthly growth is explosive:** volume roughly doubled each month from Oct 2025 through Feb 2026. February alone
accounted for 47% of all scraped listings.

---

## 2. Geography: Almost Entirely Ulaanbaatar

- **99.6%** of listings are in Ulaanbaatar (only 10 listings from provincial aimags)
- Provincial presence is negligible: Darkhan-Uul (3), plus single listings from 7 other aimags

**UB district distribution** (with caveats):

| District         | %     | Notes                                                                                                           |
| ---------------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| Sukhbaatar       | 62.9% | Heavily inflated -- 43% of all listings use a single Sukhbaatar Khoroo 1 address (likely a default/placeholder) |
| Bayanzurkh       | 10.5% |                                                                                                                 |
| Bayangol         | 7.5%  |                                                                                                                 |
| Songinokhairkhan | 7.2%  |                                                                                                                 |
| Khan-Uul         | 6.4%  |                                                                                                                 |
| Chingeltei       | 4.8%  |                                                                                                                 |
| Nalaikh/Baganuur | 0.3%  |                                                                                                                 |

**Insight for Tasky:** Location data on unegui.mn is unreliable. 100% of construction listings register to the same
Sukhbaatar address. Only cleaning and moving show genuine geographic distribution, suggesting those customers care more
about provider proximity. **No listings have GPS coordinates** -- a major opportunity for Tasky to differentiate with
proper location-based matching.

---

## 3. Pricing Landscape

### Price transparency is poor

| Pricing Type                    | % of Listings |
| ------------------------------- | ------------- |
| "Negotiable" (Үнэ тохирно)      | 51.3%         |
| Numeric price                   | 48.7%         |
| Of numeric: placeholder (1 MNT) | 10.3%         |

Over **60%** of listings effectively hide their price. This is a massive pain point for consumers.

### Actual prices by category (cleaned, >= 1,000 MNT)

| Category     | Median Price | Mean Price | Range       |
| ------------ | ------------ | ---------- | ----------- |
| Cleaning     | 4,000 ₮      | 43,006 ₮   | 1K - 850K   |
| Painting     | 15,000 ₮     | 52,728 ₮   | 1K - 899K   |
| Electrical   | 30,000 ₮     | 53,163 ₮   | 1K - 300K   |
| Construction | 50,000 ₮     | 121,837 ₮  | 1K - 950K   |
| Moving       | 60,000 ₮     | 107,144 ₮  | 1K - 500K   |
| Plumbing     | 80,000 ₮     | 138,753 ₮  | 2.5K - 800K |

**Note:** Many prices are per-unit (per sqm, per hour) rather than total job prices, which explains the wide ranges. The
most common price points cluster around round numbers: 10K, 20K, 50K, 100K, 250K MNT.

**Insight for Tasky:** Pricing is the #1 opacity problem. A platform that enforces structured pricing (hourly rate,
per-sqm rate, flat fee with scope) would be a major differentiator.

---

## 4. Seller / Supply Side Analysis

### Market structure: long tail with power sellers

- **1,083 unique sellers** across 2,374 listings
- **72.4%** post only 1 listing (casual/one-time providers)
- **Top 10 sellers (0.9%)** control **26.7%** of all listings
- **Top 50 sellers (4.6%)** control **40.8%**

### Category-level concentration

| Category     | Top 5 Seller Share | Fragmentation                                  |
| ------------ | ------------------ | ---------------------------------------------- |
| Plumbing     | 61.3%              | Highly concentrated (1 seller = 33% of market) |
| Construction | 33.5%              | Moderately concentrated                        |
| Painting     | 15.5%              | Moderate                                       |
| Cleaning     | 8.2%               | Fragmented                                     |
| Moving       | 6.0%               | Most fragmented (400 sellers for 513 listings) |

**The dominant player:** "Жагаа" (seller ID 4477125) has 193 listings across 5 categories, including 33% of all plumbing
listings. This is a professional multi-service provider.

### Seller profile

- **98.3% individuals**, only 1.7% identifiable companies (ХХК/LLC in name)
- **50.9%** of active sellers registered pre-2020 (6+ year platform veterans)
- **22.1%** joined in 2024+ (new supply entering)
- Platform launched ~Sep 2016 (largest registration cohort)
- **100%** have phone numbers (8-digit Mongolian mobile); phones are hidden behind a click-to-reveal UI

### Multi-service providers

- 90.4% operate in only 1 category
- 8.0% in 2 categories (most common: construction + painting)
- < 1% in 4+ categories

**Insight for Tasky:** The supply side is overwhelmingly informal individuals, not businesses. Most are casual (1
listing), but a small power-seller class exists. Moving has the most competitive supply (easiest to recruit?), while
plumbing is the most monopolized (hardest to disrupt but highest switching potential).

---

## 5. Listing Quality & User Experience

### Listing tier (paid promotion)

| Tier           | %     | Median Views | Effect             |
| -------------- | ----- | ------------ | ------------------ |
| Regular (free) | 92.3% | 5            | Baseline           |
| Top (paid)     | 6.1%  | 26           | **5x** more views  |
| VIP (paid)     | 1.6%  | 117          | **23x** more views |

**Insight:** Organic discoverability on unegui.mn is extremely poor. Free listings get a median of just 5 views. Sellers
must pay for visibility, which means unegui.mn is primarily monetizing supply-side frustration.

### Content quality is low

| Metric                     | Value         |
| -------------------------- | ------------- |
| Median description length  | 52 characters |
| Median images              | 2             |
| Listings with 1 image only | 42.6%         |
| No GPS coordinates         | 100%          |
| Listings that are re-posts | 26.2%         |

- Cleaning has the best descriptions (avg 203 chars), moving the worst (76 chars)
- Painting listings have the most images (avg 5.8), moving the fewest (avg 2.4)
- VIP listings average 9 images vs 3.9 for regular -- paid sellers invest more in content

### Duplicate / spam problem

- **49.5%** of listings share a title with at least one other listing
- **26.2%** are same-seller re-posts of the same title
- Top re-poster (Жагаа) re-posts the same services 5-12 times each

**Insight for Tasky:** Unegui.mn has a significant spam/re-posting problem. A platform with verified profiles,
structured service listings, and review systems would provide a vastly better consumer experience.

---

## 6. Demand Signals (Views)

| Metric          | Value       |
| --------------- | ----------- |
| Median views    | 5           |
| Mean views      | 38          |
| 96% of listings | < 100 views |
| Max views       | 16,691      |

**Views by category** (median): Cleaning (15) > Electrical (9) > Moving (8) > Painting (6) > Plumbing (5) >
Construction (2)

Cleaning gets the most views per listing, likely because fewer listings = less competition + higher consumer search
frequency. Construction has the lowest median despite being the largest category.

**Correlation analysis:** Listing tier is the overwhelmingly dominant driver of views. Description length, image count,
and price have negligible correlation with views. The platform's discovery mechanism rewards spending, not quality.

---

## 7. Temporal Patterns

- **Peak posting day:** Tuesday (23.4%), especially for construction
- **Peak posting hour:** 07:00 (morning posting before work)
- **Lowest day:** Saturday (11.3%)
- **Massive seasonal spike:** Feb-March volume reflects spring renovation demand
- Monthly doubling trend: 64 listings (Sep) -> 1,121 (Feb)

**Insight for Tasky:** There is extreme seasonality. Construction/painting/plumbing surge in spring. A marketplace would
need supply elasticity strategies for peak season.

---

## 8. Content & Language Patterns

**Most common title phrases:**

1. "ажил хийнэ" (will do work) - 159 occurrences
2. "ачаа ачна" (will haul cargo) - 151
3. "бүх төрлийн" (all types of) - 98
4. "засвар хийнэ" (will do repairs) - 48
5. "бөглөө гаргана" (will clear blockage) - 36

**Language:** ~15-20% of listings use romanized Mongolian (Latin script) instead of Cyrillic. This is notable for
search/matching -- Tasky would need to handle both scripts.

**Title patterns:** Sellers describe what they _do_ rather than what they _are_. Titles are action-oriented ("will do
X") rather than identity-oriented ("professional X service"). This reflects the informal, gig-economy nature of the
market.

---

## 9. Key Strategic Takeaways for Tasky

1. **The market is real and growing fast** -- 43 new service listings/day with explosive month-over-month growth
2. **Price transparency is the #1 gap** -- 60%+ of listings hide pricing; structured pricing would be a killer feature
3. **Location is broken** -- zero GPS data, most addresses are placeholders; location-based matching is a wide-open
   opportunity
4. **Quality signals don't exist** -- no reviews, no ratings, no verified identities, low-quality descriptions; trust
   infrastructure is the core value proposition
5. **Supply is informal and individual** -- 98% are solo operators, not companies; onboarding UX must be mobile-first
   and dead simple
6. **Spam/re-posting is rampant** -- verified profiles with one listing per service would massively improve the consumer
   experience
7. **Unegui.mn monetizes supply frustration** -- paid promotion is the only way to get views; a platform that gives fair
   organic visibility would attract sellers
8. **Moving and cleaning are the most accessible entry categories** -- fragmented supply (easy to recruit), reasonable
   demand, and lower ticket sizes for consumer trust-building
9. **Plumbing has the most disruption potential** -- one seller controls 33% of listings, consumers have little choice,
   and it's a high-urgency need (frozen/blocked pipes)
10. **Seasonality demands planning** -- spring surge (Feb-Mar) in construction/painting/plumbing requires pre-built
    supply
