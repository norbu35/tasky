# Facebook Group Growth Strategy

This document outlines a structured approach to leveraging existing, high-traffic Facebook groups to solve the "cold start" liquidity problem for Tasky, inspired by Airbnb's early Craigslist integration.

## 1. The Strategy Breakdown

We have two distinct pools of users on Facebook to target: **Taskers** looking for work, and **Customers** looking for help. We need a dual-sided approach.

### A. Supply-Side Acquisition (Attracting Taskers)
When a Customer posts a job natively on Tasky, we want to maximize its visibility to attract taskers to download the app.

- **The Hook:** Automatically cross-post new Tasky jobs to relevant Facebook groups (e.g., "UB Jobs", "Plumbers Mongolia").
- **The Format:** *"New Job Alert 🚨: Someone nearby needs a plumber! Budget: 50,000 MNT. See exactly where on the map and apply instantly here: [Deep_Link_to_App]"*
- **The Goal:** Taskers see a real, paying job on Facebook but must download Tasky to get the Customer's contact details and exact location.

### B. Demand-Side Acquisition (Attracting Customers)
Customers are already posting jobs on Facebook textually (e.g., "Need someone to fix my sink in Zaisan"). We can "hijack" this intent.

- **The Hook (Scraping):** A bot continuously scans targeted groups for new job posts.
- **The Import:** The bot uses an LLM (OpenAI/Gemini) to parse the unstructured Facebook post text into a structured Tasky job (Category, Budget, Approximate Location) and automatically posts it to the Tasky Map.
- **The Outreach:** The bot replies to the Customer's Facebook post: *"Hey! I added your job to the Tasky Map so local workers can find you faster. When they apply, you'll see them here: [Deep_Link_to_Their_Auto_Generated_Job]." 
- **The Goal:** The Customer gets immediate value (wider distribution of their job) and is incentivized to check the platform to see applicants.

---

## 2. Technical Implementation Architecture

Facebook's Graph API is notoriously locked down, especially for Groups you do not own. Therefore, this must be executed using **Browser Automation / Scraping**.

### The Stack
- **Engine:** `Puppeteer-Extra` or `Playwright` using undetected-chromedriver profiles to evade basic bot detection.
- **Proxy Network:** Rotating Residential Proxies (e.g., BrightData or Oxylabs) scoped to Mongolian IP addresses to prevent immediate IP bans.
- **Accounts:** A fleet of "Aged" Facebook accounts (bought or created months ago, with existing activity). Do not use fresh accounts.
- **Data Parsing:** Pass scraped HTML/Text from the group feed through a lightweight `gpt-4o-mini` prompt to extract `Title`, `Budget (if any)`, and `Location`.
- **Backend Link:** A dedicated Node.js/Python microservice that runs these cron jobs and talks to the primary Tasky Spring Boot API via a dedicated Service Account.

### The Flow
1. **Cron Job (Every 15 mins):** Puppeteer logs into an aged account, navigates to `facebook.com/groups/target_group_id?sorting_setting=CHRONOLOGICAL`.
2. **Extraction:** Scrape the last 10 posts. Filter out previously seen IDs.
3. **LLM Parsing:** Convert "Need my house cleaned today in 13th microdistrict, will pay 30k" -> `{ category: "Cleaning", budget: 30000, location: "13th Microdistrict" }`.
4. **API Call:** Call `POST /api/v1/tasks/imported` on the Tasky backend.
5. **Action:** Puppeteer automatically comments on the original Facebook post with the Tasky Lead-Gen link.

---

## 3. Risks & Mitigations

This is guerrilla marketing and violates Facebook's Terms of Service. It must be executed carefully.

| Risk | Mitigation |
| :--- | :--- |
| **Account Bans** | Rotate through a pool of 10-20 aged accounts. If one gets banned, the system swaps to the next. Use residential Mongolian IPs. |
| **Spam Complaints** | Randomize the auto-reply message text format so Facebook's spam heuristic doesn't catch repeated strings. "Spintax" (e.g., `[Hey|Hi|Hello] there!`) is highly recommended. |
| **Group Admin Blocks** | Don't over-post. Throttle to a maximum of 3-5 cross-posts per group per day to avoid annoying group moderators. Interleave real "human-like" likes/scrolls during the Puppeteer session. |
| **Data Quality** | Ensure the UI clearly marks "Imported from Facebook" on tasks so users know why the exact phone number/identity isn't verified in the system yet. |

## 4. Phase 1 Recommendations

Start with **Supply-Side Acquisition (A)** first. It is significantly easier (and safer) to use an automated account to *post* our verified app content into a group 3 times a day, rather than rapidly scraping and commenting on hundreds of strangers' posts. Once the map has density, we can test the demand-side hijack.
