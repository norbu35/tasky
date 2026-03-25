# Stitch Design Generation Plan

Reusable runbook for generating all missing Tasky mobile screens in Stitch.
Run one screen at a time. Check off each screen when done. Resume from the first unchecked item.

## Project

- **Stitch Project ID:** `1394629243985750341`
- **Project name:** My Tasks (Mongolian)
- **Device type:** `MOBILE`
- **Model:** `GEMINI_3_1_PRO`

## How to Use

For each unchecked screen below, call:

```
mcp__stitch__generate_screen_from_text(
  projectId: "1394629243985750341",
  deviceType: "MOBILE",
  modelId: "GEMINI_3_1_PRO",
  prompt: <prompt from this file>
)
```

Wait for completion (can take 1–3 min). Mark the checkbox. Move to next.

---

## Design System Reference (embed context in all prompts)

**Brand Palette — "Тэнгэр" (Sky):**

- Background: Clean Off-White `#F9F8F5`
- Primary: Deep Sky Blue `#1B3A5C`, Deep Container: Deeper Sky `#102638`
- Secondary: Steppe Gold `#C49A3C` (ratings, warm CTAs, borders)
- Accent: Open Sky `#6BA3BE` (highlights, interactive)
- Trust: Blue `#3568A1` (trust badges, authority indicators)
- Verified badge: Sage Emerald `#469178`
- Danger / Error: Red `#EF4444`
- Surface cards: White `#ffffff`
- Muted sections: `#f0efed`
- Border-free: use background color shifts or Steppe Gold accents, avoid generic 1px grey lines

**Typography:**

- Headlines / display: Manrope Bold (600-800)
- Body / labels: Plus Jakarta Sans, minimum 16px body (hard floor for Cyrillic readability)
- Cyrillic line-height: minimum 1.6
- Flush-left alignment (never justified)

**Component rules:**

- Recognition Marker: Hand-drawn Checkmark in Sage Emerald `#469178` (single confident stroke, not geometric)
- Roundness: 12px (md), 8px (sm) — no sharp corners, no generic pills
- Floating bars (sticky CTAs, nav bar): glassmorphism, 80% opacity + backdrop blur
- Shadows: ambient tinted shadows, no generic grey drop shadows
- Active chips: Open Sky `#6BA3BE` bg + white text; inactive: muted `#f0efed`
- Bottom tab bar: 5 tabs — Home, Tasks, Bookings, Inbox, Profile

---

## Screens to Generate

### P0 — Core Navigation & Feeds

- [x] **Tab Bar Home — Task Feed (populated)**

```
A mobile home screen for Tasky, a Mongolian domestic services marketplace. Coastal Dusk design system: sandy off-white background #fdf9f4, Deep Navy #0a1f32 primary, Plus Jakarta Sans body text, Manrope headlines.

The screen shows the customer's main task feed after login. Top: a greeting header "Сайн байна уу, Болд" (Hello Bold) in Manrope Bold navy, a search bar with a filter icon. Below: a horizontal scrollable category chip row (Cleaning, Plumbing, Electrical, Moving, Painting — active chip in #badefd / #40637d, inactive in #ebe8e3).

Main content: a vertical list of task cards. Each card is white #ffffff with 12px radius and ambient navy shadow, containing: category chip (top-left), task title (Manrope semibold 18px), location with a pin icon, scheduled time, budget amount in bold, and a small "OPEN" status badge in sandy #ede9e2 with navy text. No 1px borders anywhere — card lifts from muted #f7f3ee section background.

Bottom: sticky tab bar with 5 tabs (Home, Tasks, Bookings, Inbox, Profile) with glassmorphism (80% opacity white + 12px backdrop blur), Home tab active in Deep Navy.
```

- [x] **Tab Bar Home — Tasker Feed (task browsing)**

```
A mobile screen for Tasky taskers browsing available jobs. Coastal Dusk design: sandy #fdf9f4 background, Manrope headlines, Plus Jakarta Sans body, no 1px borders.

Header: "Ажлын зар" (Job listings) in Manrope Bold 24px, a location filter showing "Улаанбаатар" with a dropdown chevron, and a map-view toggle icon (top right).

Filter chips below header: All, Nearby, High Budget, Cleaning, Plumbing — horizontally scrollable.

Feed cards (white #ffffff, 12px radius, ambient shadow): each shows task category icon, task description (truncated to 2 lines), location text with distance "1.2 km", scheduled date, budget range, and a teal "Apply" secondary button (#3f627c). Cards sit on muted #f7f3ee background sections separated by spacing, no divider lines.

Bottom sticky tab bar (glassmorphism) with 5 tabs — Tasks tab active (Deep Navy icon + label).
```

- [x] **Customer Task Detail**

```
A mobile task detail screen for a customer who posted a task on Tasky. Coastal Dusk design: sandy off-white #fdf9f4, Manrope headlines, Plus Jakarta Sans body 16px min, no 1px borders, ambient navy shadows.

Top: back arrow + "Ажлын дэлгэрэнгүй" (Task detail) title. Below: a full-width status banner in sandy #ede9e2 with navy text showing "НЭЭЛТТЭЙ • 3 өргөдөл" (OPEN • 3 applications).

Content sections (background shifts between #fdf9f4 and #f7f3ee, no lines):
1. Category chip + task title (Manrope Bold 22px) + description text
2. Details row: location pin icon + address, calendar icon + date/time, wallet icon + budget
3. "Өргөдөл гаргагчид" (Applicants) section header, then 3 applicant cards each showing avatar, name, verified badge (sage emerald #469178), star rating, short message preview, and an "Accept" primary button (Deep Navy)
4. Danger zone: "Ажлыг цуцлах" (Cancel task) ghost button in danger red

Bottom: sticky glassmorphism bar with "Өргөдлүүдийг харах" (View all applicants) primary CTA button.
```

- [x] **Applicants List**

```
A mobile applicants list screen for a task on Tasky. Customer is reviewing who applied. Coastal Dusk design: sandy #fdf9f4, Manrope headlines, Jakarta Sans body, no borders.

Header: "Өргөдөл гаргагчид (5)" back arrow left. Filter chips: All, Highest Rated, Nearest.

Applicant cards (white #ffffff, 12px radius, ambient shadow, on muted #f7f3ee background):
- Left: circular avatar (48px) with verified badge (sage emerald #469178, checkmark)
- Center: Name (Manrope semibold 16px), 5-star rating with number, response time "5 мин дотор хариулдаг", short intro message (2 lines, Jakarta Sans 14px muted)
- Right: budget proposal amount bold + "Хүлээн авах" (Accept) teal text button

Between sections: spacing only, no dividers.

Empty bottom space so last card is not hidden behind tab bar.
```

- [x] **Tasker Job Detail**

```
A mobile job detail screen for a tasker who has been assigned a booking on Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope, Jakarta Sans 16px min, no 1px borders.

Status banner at top: "ТОМИЛОГДСОН" (ASSIGNED) in Deep Navy #213448 background, white text.

Content (section background shifts, no lines):
1. Job title + category chip + customer name with avatar + star rating
2. Details: location with map preview thumbnail (rounded 12px), scheduled date/time, agreed budget
3. "Ажлын явц" (Progress) — a vertical timeline stepper with steps: Confirmed → En route → Started → Completed; current step highlighted in Deep Navy
4. Contact customer: phone and chat buttons (outline style, teal #3f627c)
5. Action zone: "Ажил дуусгах" (Mark complete) primary button + "Хойшлуулах" (Reschedule) outline button

Bottom: sticky glassmorphism bar with "Хаяг харах" (View address) full-width CTA.
```

- [x] **Inbox — Conversation List**

```
A mobile inbox screen showing a list of conversations for Tasky. Coastal Dusk design: sandy #fdf9f4 background, Manrope bold header, Jakarta Sans 16px body, no 1px borders.

Header: "Inbox" / "Мессеж" in Manrope Bold 24px. Search bar below.

Conversation list items (no dividers — use spacing 16px between items):
Each item: circular avatar (48px) left, name + task title (2 lines, bold name 16px + muted task description 14px), timestamp top-right, last message preview (1 line, muted), unread count badge (Deep Navy circle with white number) when applicable.

Unread conversations: white #ffffff background card with left accent bar in Deep Navy.
Read conversations: muted #f7f3ee background.
No 1px lines separating items — only background alternation and spacing.

Bottom tab bar (glassmorphism), Inbox tab active with unread badge.
```

- [x] **Chat Conversation**

```
A mobile chat screen between a customer and tasker on Tasky. Coastal Dusk design: sandy #fdf9f4 background, no 1px borders, ambient shadows.

Header: back arrow, tasker avatar + name "Мөнхбат" + "Цэвэрлэгч" (Cleaner) subtitle + verified badge (sage emerald), three-dot menu.

Chat bubble area (fills screen):
- Received messages (left): white #ffffff bubble, 12px radius, muted navy text, timestamp below
- Sent messages (right): Deep Navy #213448 bubble, white text, 12px radius
- Date separator: centered label "Өнөөдөр" in muted text, no lines

Booking context card (pinned near top of chat): rounded white card showing task name, date, status badge — allows quick reference.

Bottom input bar (glassmorphism sticky): attach icon, text field (rounded, sandy bg), send button (Deep Navy filled circle with arrow icon).
```

- [x] **Notifications Center**

```
A mobile notifications screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope header, Jakarta Sans 16px body, no 1px borders.

Header: "Мэдэгдэл" (Notifications) in Manrope Bold 24px + "Mark all read" teal text button right.

Notification items grouped by TODAY / EARLIER (section headers in muted small caps):
Each notification: icon left (bell, checkmark, warning — in Deep Navy circle), title + description 2 lines, timestamp right, unread dot indicator (teal).

Notification types shown:
- "Та ажилтантай тохирлоо!" (You've been matched!) — booking confirmed
- "Шинэ өргөдөл ирлээ" (New application received)
- "Үнэлгээ үлдээхийг бүү мартаарай" (Don't forget to leave a review)

No dividers — 16px spacing between items. White #ffffff card per item with ambient shadow on muted #f7f3ee background.
```

---

### P1 — Task Creation (Missing Steps)

- [x] **Post Task — Step 2: Location**

```
A mobile task creation step 2 of 7 screen for Tasky — "Байршил" (Location). Coastal Dusk design: sandy #fdf9f4, Manrope Bold heading, Jakarta Sans body 16px min, no 1px borders.

Top: step progress dots (7 total, step 2 active — wider dot in teal #6ba3be, completed dot in Deep Navy, remaining in inactive #d8dde2).

Content:
- Section title "Байршил сонгох" (Select location) Manrope Bold 20px
- A map view (rounded 12px) showing Ulaanbaatar with a pin in Deep Navy at city center, approximately 2/3 height of content area
- Below map: address text field (white card input, 12px radius, no border, muted placeholder "Хаяг оруулах...") — currently filled with "Сүхбаатар дүүрэг, 1-р хороо"
- "Одоогийн байршил ашиглах" (Use current location) — teal text with GPS icon

Bottom sticky bar: Back outline button + Next primary button (Deep Navy, 12px radius). Glassmorphism (80% opacity + backdrop blur).
```

- [x] **Post Task — Step 5: Schedule**

```
A mobile task creation step 5 of 7 screen for Tasky — "Цаг товлох" (Schedule). Coastal Dusk design: sandy #fdf9f4, Manrope headings, Jakarta Sans 16px body, no 1px borders.

Top: step progress dots (7 total, step 5 active).

Content:
- Title "Хэзээ хийлгэх вэ?" (When do you need it?) Manrope Bold 20px
- Date picker: a horizontal scrollable row of date chips for the next 7 days (Mon Mar 25, Tue Mar 26, etc.) — active date chip in Deep Navy with white text, others in white card with border-free raised appearance
- Time section: "Цаг" header + a grid of time chips (8:00, 9:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00, 18:00) — active chip in teal #badefd/#40637d, inactive in #ebe8e3
- "Яаралтай" (ASAP) toggle option at top with a lightning bolt icon

Bottom sticky glassmorphism bar: Back + Next buttons.
```

- [x] **Post Task — Step 6: Photos**

```
A mobile task creation step 6 of 7 screen for Tasky — "Зураг нэмэх" (Add photos). Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px body, no 1px borders, ambient shadows.

Top: step progress dots (7 total, step 6 active).

Content:
- Title "Зураг нэмэх (заавал биш)" (Add photos — optional) Manrope Bold 20px
- Subtitle muted text: max 3 photos allowed
- Photo grid (3 slots, 2/3 width square each with 12px radius):
  - Slot 1: filled with a sample home interior photo
  - Slot 2: filled with a second photo showing a messy room
  - Slot 3: empty slot with a dashed outline (subtle, not a hard border) and a camera icon + "Нэмэх" (Add)
- Below grid: "Камер ашиглах" (Use camera) + "Галлерейгаас сонгох" (Choose from gallery) — two ghost buttons side by side

Bottom sticky glassmorphism bar: Back + "Дараах" (Next) primary button.
```

---

### P2 — Auth & Onboarding

- [x] **Onboarding — Welcome**

```
A mobile onboarding welcome screen for Tasky, a Mongolian domestic services marketplace. Coastal Dusk design: Deep Navy #213448 to #0a1f32 gradient background (135 degrees), white and sandy text, Manrope Bold display type.

Full-screen illustration area (top 55%): stylized abstract illustration of a clean home interior or trusted handshake, in muted sandy/teal tones on the navy background.

Bottom content panel (sandy #fdf9f4, top corners rounded 24px, elevated with ambient shadow):
- "Таскид тавтай морил" (Welcome to Tasky) Manrope Bold 28px Deep Navy
- Subtitle: "Итгэлтэй гэрийн үйлчилгээ, хурдан, хялбар" (Trusted home services, fast and easy) Jakarta Sans 16px muted
- "Эхлэх" (Get started) primary button (Deep Navy fill, white text, 12px radius, full width)
- "Нэвтрэх" (Log in) ghost text button below

Pagination dots (3 onboarding pages) centered above the CTA.
```

- [x] **Onboarding — How It Works**

```
A mobile onboarding step 2 of 3 screen for Tasky. Coastal Dusk design: Deep Navy to #213448 gradient background, white/sandy text.

Illustration area (top 55%): abstract 3-step illustration — post a task → get matched → task done, in teal/sandy tones on navy.

Bottom content panel (sandy #fdf9f4, top corners 24px):
- "Хэрхэн ажилладаг вэ?" (How does it work?) Manrope Bold 26px
- 3 steps listed with numbered icons (Deep Navy circles):
  1. "Ажил нийтлэх" (Post a task) — Jakarta Sans 16px
  2. "Мэргэжилтэн сонгох" (Choose a professional)
  3. "Ажил хийлгэх" (Get it done)
- "Дараах" (Next) primary button full width

Pagination dots — step 2 active.
```

- [x] **Role Selection**

```
A mobile role selection screen for Tasky — user chooses whether they are a customer or a tasker. Coastal Dusk design: sandy #fdf9f4 background, Manrope Bold heading, Jakarta Sans body 16px, no 1px borders, ambient shadows.

Header: "Та хэн бэ?" (Who are you?) Manrope Bold 28px, centered. Subtitle muted "Дараа нь роль сольж болно" (You can switch roles later).

Two large selection cards (white #ffffff, 12px radius, ambient navy shadow, 12px gap):

Card 1 — Customer:
- Icon: illustration of person relaxing at home (teal accent)
- "Захиалагч" (Customer) Manrope semibold 20px
- "Гэртээ ажил хийлгэх" (Get work done at home) muted subtitle
- Selected state: Deep Navy border outline (2px) + teal check badge top-right

Card 2 — Tasker:
- Icon: illustration of person with tools (navy accent)
- "Ажилтан" (Tasker) Manrope semibold 20px
- "Ажил хийж орлого олох" (Work and earn income) muted subtitle

"Үргэлжлүүлэх" (Continue) primary button (Deep Navy, full width) at bottom, disabled until a card is selected.
```

- [x] **Permission Primer — Location**

```
A mobile permission primer screen for Tasky requesting location access. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, centered layout.

Center-aligned illustration: a large map pin icon in Deep Navy with a subtle teal glow halo, on a white card (12px radius) with ambient shadow. The pin sits on a stylized minimalist map background.

Below the illustration:
- "Байршлаа зөвшөөрнө үү" (Allow location access) Manrope Bold 24px Deep Navy
- Explanation text: "Танд ойр байгаа мэргэжилтнүүдийг харуулахын тулд байршил шаардлагатай." (Location is needed to show professionals near you.) Jakarta Sans 16px, muted, centered, 1.5 line-height
- "Зөвшөөрөх" (Allow) primary button (Deep Navy, full width, 12px radius)
- "Алгасах" (Skip) ghost link below

No decorative lines. Bottom safe area spacing.
```

- [x] **Permission Primer — Notifications**

```
A mobile permission primer screen for Tasky requesting notification access. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center illustration: a large bell icon in Deep Navy with a "1" badge (teal), soft navy glow, on a white card with ambient shadow.

Below:
- "Мэдэгдэл зөвшөөрнө үү" (Allow notifications) Manrope Bold 24px
- Explanation: "Ажлын шинэчлэлт, мессеж, захиалгын мэдэгдэл авахын тулд зөвшөөрнө үү." (Allow to receive job updates, messages, and booking alerts.) Jakarta Sans 16px muted centered 1.5 line-height
- "Зөвшөөрөх" (Allow) primary button
- "Дараа нь" (Not now) ghost link

Clean, centered, generous whitespace (spacing-16 vertical padding).
```

- [x] **Permission Primer — Camera**

```
A mobile permission primer screen for Tasky requesting camera access. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center illustration: a camera icon in Deep Navy with a soft teal shutter circle, on a white ambient-shadow card.

Below:
- "Камерын зөвшөөрөл" (Camera access) Manrope Bold 24px
- Explanation: "Ажлын зурагт авалтын тулд камерын зөвшөөрөл шаардлагатай." (Camera access is needed to add photos to your task.) Jakarta Sans 16px muted 1.5 line-height
- "Зөвшөөрөх" (Allow) primary Deep Navy button
- "Алгасах" (Skip) ghost link
```

---

### P3 — Profile & Verification

- [x] **Profile Tab — Own Profile**

```
A mobile profile screen for a Tasky user viewing their own profile. Coastal Dusk design: sandy #fdf9f4, Manrope Bold headings, Jakarta Sans 16px body, no 1px borders, ambient shadows.

Top section (Deep Navy #213448 background, rounded bottom corners 24px):
- Large circular avatar (72px) with verified badge (sage emerald #469178)
- Name "Болд Дорж" Manrope Bold 22px white
- Role chips: "Захиалагч" (Customer) + "Ажилтан" (Tasker) — teal outline chips, active in filled teal
- Rating: 4.8 stars (small yellow stars) + "(12 үнэлгээ)" review count in muted

Content (sandy background, white card sections):
Stats row: 3 cards — Tasks posted: 8, Jobs completed: 15, Member since: 2024
Settings list (no dividers, spacing only):
- "Профайл засах" (Edit profile) → arrow
- "Мэдэгдэл" (Notifications) → arrow
- "Хэл" (Language) → "Монгол" + arrow
- "Нууцлалын бодлого" (Privacy policy) → arrow
- "Гарах" (Sign out) — danger red text
```

- [x] **Edit Profile**

```
A mobile edit profile screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold header, Jakarta Sans 16px body, no 1px borders, ambient shadows.

Header: back arrow + "Профайл засах" (Edit profile) Manrope Bold 20px + "Хадгалах" (Save) teal text button right.

Content:
- Avatar section: large circular avatar (80px) with a camera icon overlay button (Deep Navy small circle), centered. Tap to change.
- Form fields (white card sections, no borders, floating labels):
  - "Нэр" (Full name): "Болд Дорж" filled
  - "Утасны дугаар" (Phone): "+976 9911-XXXX" filled and disabled (greyed)
  - "Танилцуулга" (Bio): textarea "Хурдан, найдвартай цэвэрлэгч..." (Fast, reliable cleaner...) 3 lines
- Tasker section (if role is tasker): skill tags row with Add button
- Danger zone at bottom: "Бүртгэл устгах" (Delete account) red ghost button
```

- [x] **Tasker Public Profile**

```
A mobile public profile screen for a tasker on Tasky. A customer is viewing this profile. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, ambient shadows.

Hero section (Deep Navy #213448 background with subtle gradient, rounded bottom corners 24px):
- Large circular avatar (80px) centered
- Name "Мөнхбат Г." Manrope Bold 24px white
- Verified badge row: "Баталгаажсан" (Verified) sage emerald chip + "Цэвэрлэгч" (Cleaner) category chip
- 4.9 star rating + "47 ажил" (47 jobs) in muted white text
- "Response time: 5 min"

Stats row (3 white cards with ambient shadow):
Jobs Done: 47 | Rating: 4.9 | Member: 2023

Content sections (no dividers):
- "Тухай" (About): bio text
- "Ур чадвар" (Skills): chip tags — Deep Cleaning, Windows, Laundry
- "Үнэлгээнүүд" (Reviews): 3 review cards (avatar + name + stars + comment)
- "Ижил төстэй ажилтнууд" (Similar taskers) horizontal scroll

Bottom sticky glassmorphism bar: "Ажил санал болгох" (Offer a task) primary CTA button (Deep Navy).
```

- [x] **Tasker Stats Dashboard**

```
A mobile stats dashboard for a tasker on Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold headings, Jakarta Sans 16px body, no 1px borders, ambient navy shadows.

Header: "Миний статистик" (My stats) Manrope Bold 24px.

Date range selector: Last 7 days / 30 days / All time — pill chips, active in Deep Navy.

Stats grid (2x2 white cards, 12px radius, ambient shadow):
- Jobs Completed: 47 (trend +5 this week, green arrow)
- Average Rating: 4.9 (5 yellow stars)
- Response Time: 4 min (teal lightning icon)
- Reliability Score: 98% (sage emerald shield icon)

Earnings card (full width, Deep Navy background, white text):
- "Нийт орлого" (Total earnings) Manrope Bold 20px
- Amount: "₮ 2,450,000" display size
- Bar chart showing weekly earnings (sandy bars on navy bg)

Recent jobs list (3 items, no dividers — spacing only):
- Job title + customer avatar + date + earnings + rating stars
```

- [x] **Verification — Consent**

```
A mobile verification consent screen for Tasky taskers. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Header: "Баталгаажуулалт" (Verification) Manrope Bold 24px.

Content (white card, 12px radius, ambient shadow):
- Shield icon (sage emerald #469178, large) centered at top of card
- "Яагаад баталгаажуулалт хэрэгтэй вэ?" (Why is verification needed?) Manrope semibold 18px
- Explanation: "Таны иргэний үнэмлэхийг баталгаажуулснаар захиалагчид танд итгэх боломжтой болно. Энэ нь ажил авах магадлалыг 3 дахин нэмэгдүүлнэ." Jakarta Sans 16px muted 1.5 line-height
- What's required list (checkmark icons in sage emerald):
  ✓ Иргэний үнэмлэхний урд тал (ID card front)
  ✓ Иргэний үнэмлэхний ар тал (ID card back)
  ✓ Хөрөг зураг (Selfie)
- Privacy note in muted small text: data is encrypted and not shared

"Баталгаажуулалт эхлэх" (Start verification) primary Deep Navy button full width.
"Дараа нь" (Later) ghost link.
```

- [x] **Verification — Upload Documents**

```
A mobile document upload screen for Tasky tasker verification. Coastal Dusk design: sandy #fdf9f4, Manrope, Jakarta Sans 16px, no 1px borders.

Step progress: 3 steps — Front / Back / Selfie. Current step 1 (Front) active in Deep Navy, others in inactive #d8dde2.

Upload area (white card, 12px radius, ambient shadow, centered):
- Camera/upload illustration in teal
- "Иргэний үнэмлэхний урд талыг дарж авна уу" (Take a photo of the front of your ID card) Manrope semibold 18px
- Instructions: good lighting, all 4 corners visible, no glare — bullet list in muted Jakarta Sans 14px
- Two buttons: "Камер" (Camera) — Deep Navy primary | "Галерей" (Gallery) — outline

Below: previously uploaded pages shown as small thumbnails with remove X button.

Bottom: "Дараах" (Next) disabled until photo added.
```

- [x] **Verification — Pending**

```
A mobile verification pending status screen for Tasky. Coastal Dusk design: sandy #fdf9f4, centered layout, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center illustration: a large animated-style clock or hourglass in Deep Navy with a teal glow, on a white ambient-shadow card.

Content:
- "Хянагдаж байна" (Under review) Manrope Bold 26px Deep Navy, centered
- Submitted date: "2026.03.22 ирүүлсэн" in muted small text
- Explanation: "Таны мэдээлэл 24-48 цагийн дотор шалгагдана. Баталгаажсан тохиолдолд мэдэгдэл ирэх болно." Jakarta Sans 16px muted centered 1.5 line-height

Status tracker (vertical steps):
✓ Documents submitted (completed, Deep Navy)
○ Under review (active, teal pulse dot)
○ Verification complete (upcoming, inactive)

"Нүүр хуудас руу буцах" (Back to home) outline button.
```

- [x] **Verification — Approved**

```
A mobile verification approved celebration screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center: large sage emerald (#469178) shield with a checkmark, soft glow halo, on a white card with ambient shadow. Subtle confetti dots in teal and sandy tones in background.

Content:
- "Баталгаажлаа!" (Verified!) Manrope Bold 28px Deep Navy centered
- "Таны иргэний үнэмлэх амжилттай баталгаажлаа. Одоо та ажил хийж эхэлж болно." Jakarta Sans 16px muted centered 1.5 line-height
- Verified badge preview: pill chip "✓ Баталгаажсан" sage emerald background white text
- "Ажил хайх" (Browse jobs) primary Deep Navy button full width
- "Профайл харах" (View profile) outline button
```

- [x] **Verification — Rejected**

```
A mobile verification rejected screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center illustration: a triangle warning icon in danger red #ba1a1a with a soft red glow, on a white ambient-shadow card.

Content:
- "Баталгаажуулалт амжилтгүй" (Verification failed) Manrope Bold 26px Deep Navy centered
- Admin notes in a muted sandy #f7f3ee rounded panel: "Иргэний үнэмлэхний зураг тодорхой биш байна. Дахин оруулна уу." (ID card photo is unclear. Please resubmit.) Jakarta Sans 16px
- Requirements reminder list with red X icons:
  ✗ Photo quality too low
  ✗ ID card partially obscured

"Дахин оруулах" (Resubmit) primary Deep Navy button full width.
"Тусламж авах" (Get help) outline teal button.
```

---

### P4 — Bookings & Post-booking

- [x] **Customer Bookings List**

```
A mobile bookings list screen for a customer on Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold header, Jakarta Sans 16px body, no 1px borders, ambient shadows.

Header: "Захиалгууд" (Bookings) Manrope Bold 24px.
Filter tabs below header: Active / Completed / Cancelled — underline tab style, active tab in Deep Navy with teal underline, no border boxes.

Booking cards (white #ffffff, 12px radius, ambient shadow on muted #f7f3ee bg):
- Status badge top-right: "ТОМИЛОГДСОН" (ASSIGNED) in Deep Navy chip
- Tasker avatar (small 41px) + name + verified badge
- Task title + category chip
- Date/time row + location pin
- Budget amount bold
- "Дэлгэрэнгүй" (View details) link arrow right

Empty state (when no bookings): EmptyState illustration + "Одоогоор захиалга байхгүй байна" (No bookings yet) + "Ажил нийтлэх" (Post a task) primary button.

Bottom tab bar (glassmorphism) — Bookings tab active.
```

- [x] **Booking Confirmation — Accept Applicant**

```
A mobile booking confirmation screen for Tasky. Customer is confirming they want to hire an applicant. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, ambient shadows.

Header: back arrow + "Захиалга баталгаажуулах" (Confirm booking) Manrope Bold 20px.

Tasker summary card (white, 12px radius, ambient shadow):
- Avatar (60px) + name + verified badge + star rating
- Skills chips: Deep Cleaning, Windows
- "Response time: 5 min"

Booking summary card (white, 12px radius):
- Task: "Байрны цэвэрлэгээ" (Apartment cleaning)
- Date: "2026.03.28, 10:00"
- Location: "СБД, 1-р хороо"
- Budget: "₮ 80,000"

Liability disclaimer (muted sandy #f7f3ee panel, 12px radius):
"Та ажилтанг сонгосноор Tasky-ийн үйлчилгээний нөхцөлийг зөвшөөрч байна." Jakarta Sans 14px muted — with a checkbox "Зөвшөөрч байна" (I agree)

Bottom: "Баталгаажуулах" (Confirm booking) primary Deep Navy button — enabled only when checkbox checked.
```

- [x] **Booking Confirmed — Success**

```
A mobile booking confirmed success screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders. Celebratory mood.

Center celebration card (white, 12px radius, ambient shadow):
- Large teal checkmark animation circle (Deep Navy ring, teal check, sage glow)
- "Захиалга баталгаажлаа!" (Booking confirmed!) Manrope Bold 28px Deep Navy centered
- Tasker info: avatar + name + date + time — compact row
- "Таны гэрийн хаяг руу очих болно" muted 16px

Next steps list (sandy #f7f3ee panel, no borders):
1. Tasker will contact you
2. Be available at the scheduled time
3. Rate after the service

"Захиалгыг харах" (View booking) primary Deep Navy button.
"Нүүр хуудас руу" (Go to home) ghost text button.
```

- [x] **Reschedule Request Modal**

```
A mobile bottom sheet modal for rescheduling a booking on Tasky. Coastal Dusk design: white #ffffff sheet over sandy dimmed background, Manrope Bold title, Jakarta Sans 16px, no 1px borders.

Bottom sheet (white, top corners 24px, elevated with ambient navy shadow):
- Handle bar at top (short rounded rect, muted color)
- "Цаг өөрчлөх" (Reschedule) Manrope Bold 20px
- Current booking time shown: "2026.03.28, 10:00" — muted text

New date picker:
- Horizontal scrollable date chips (next 7 days) — active in Deep Navy, inactive white card raised
- Time grid chips below (full hours, 8:00–18:00) — active teal #badefd, inactive #ebe8e3

Reason field (optional textarea, white bg, floating label "Шалтгаан оруулах" — no border, ambient input style).

"Хүсэлт илгээх" (Send request) primary Deep Navy button full width.
"Цуцлах" (Cancel) ghost link below.
```

- [x] **Booking Timeline**

```
A mobile booking timeline / audit trail screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold heading, Jakarta Sans 16px body, no 1px borders.

Header: back arrow + "Захиалгын явц" (Booking timeline) Manrope Bold 20px.

Booking summary (compact white card, ambient shadow): task name + tasker name + date.

Vertical timeline (no dividing lines — connected with a Deep Navy vertical line between dots):
Events (oldest first):
• "Захиалга үүслээ" (Booking created) — Deep Navy dot, filled — date/time right
• "Ажилтан хүлээн авлаа" (Tasker accepted) — Deep Navy dot, filled
• "Ажилтан замдаа гарлаа" (Tasker en route) — teal dot, filled, "In progress" label
• "Ажил дууслаа" (Job completed) — inactive grey dot, upcoming
• "Үнэлгээ өгөх" (Leave a review) — inactive grey dot, upcoming

Each event: bold event name + muted actor text ("By: Мөнхбат" or "By: System") + timestamp.

Bottom: "Захиалга харах" (View booking) outline button.
```

- [x] **Dispute — File a Dispute**

```
A mobile dispute filing screen for Tasky. Customer or tasker filing a complaint about a booking. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, ambient shadows.

Header: back arrow + "Гомдол гаргах" (File a dispute) Manrope Bold 20px.

Booking reference card (white, 12px radius, compact): task name + tasker/customer + date + amount.

Form (white card, no internal borders):
- "Шалтгаан" (Reason) — select field with chevron, options: Quality issue / No-show / Payment issue / Other
- "Дэлгэрэнгүй тайлбар" (Detailed description) — textarea, floating label, 4 lines, min 50 chars counter below right
- "Зураг хавсаргах" (Attach photos) — optional, photo grid with add slots (dashed outline, not hard border)

Warning panel (muted sandy #f7f3ee, 12px radius, amber warning icon): "Гомдол нь 48 цагийн дотор шийдвэрлэгдэнэ." (Disputes are resolved within 48 hours.)

"Гомдол илгээх" (Submit dispute) primary Deep Navy button full width — disabled until reason + description filled.
```

- [x] **Dispute Detail**

```
A mobile dispute detail screen for Tasky. Showing status and resolution of a filed dispute. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Header: back arrow + "Гомдлын дэлгэрэнгүй" (Dispute detail) Manrope Bold 20px.

Status banner: "ХЯНАГДАЖ БАЙНА" (UNDER REVIEW) in amber/warning background #f1ede8 with amber text — full width.

Dispute summary card (white, 12px radius, ambient shadow):
- Booking reference + date filed
- Reason: "Чанарын асуудал" (Quality issue)
- Description text (2-3 lines)
- Attached photos grid (small thumbnails)

Timeline (vertical, Deep Navy line):
• Dispute filed — completed dot + date
• Under review — active teal dot
• Resolution — inactive dot

Admin response area (muted sandy panel): "Манай баг таны гомдолтой танилцаж байна." (Our team is reviewing your dispute.) — muted italic.

"Дэмжлэг авах" (Contact support) outline teal button.
```

- [x] **Review Form**

```
A mobile review / rating submission screen for Tasky. After a booking is complete. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, ambient shadows.

Header: "Үнэлгээ өгөх" (Leave a review) Manrope Bold 24px centered.

Tasker card (white, 12px radius, ambient shadow): avatar (64px) + name + verified badge — centered.

Rating sections (white cards, no borders between criteria):
"Чанар" (Quality) — 5 large star tap targets, currently 5 filled
"Цаг баримтлал" (Punctuality) — 5 stars
"Харилцаа" (Communication) — 5 stars

Overall score: large display "4.7" in Manrope Bold 48px Deep Navy, centered with 5 star row below.

Comment field (white card, floating label "Сэтгэгдэл үлдээх..." optional, 3 lines).

"Үнэлгээ илгээх" (Submit review) primary Deep Navy button full width.
"Алгасах" (Skip) ghost link below.
```

- [x] **Rebook**

```
A mobile rebook screen for Tasky. Customer is rebooking the same tasker for a new job. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Header: back arrow + "Дахин захиалах" (Rebook) Manrope Bold 20px.

Previously booked tasker card (white, ambient shadow): avatar + name + verified + last booking info "Last: Apartment cleaning, 2026.03.15" + rating.

Form (pre-filled from previous booking, editable):
- Category chip (pre-selected, can change)
- Task description textarea (pre-filled, editable)
- Location field (pre-filled from last booking)
- Date picker chips (7 days, new dates)
- Budget field (pre-filled, editable)

"Дахин захиалах" (Rebook now) primary Deep Navy button full width.
```

---

### P5 — Edge Cases & Utility

- [x] **Session Expired**

```
A mobile session expired / logged out screen for Tasky. Coastal Dusk design: sandy #fdf9f4, centered, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center: lock icon in muted navy on white ambient-shadow card.
- "Сесс дууслаа" (Session expired) Manrope Bold 24px
- "Таны нэвтрэлт хугацаа дуусчээ. Дахин нэвтэрнэ үү." (Your session has expired. Please log in again.) Jakarta Sans 16px muted centered 1.5 line-height
- "Нэвтрэх" (Log in) primary Deep Navy button full width.
```

- [x] **Account Suspended**

```
A mobile account suspended screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center: pause/warning icon in amber on white ambient-shadow card.
- "Бүртгэл түр зогссон" (Account temporarily suspended) Manrope Bold 22px
- "Таны бүртгэл дүрэм зөрчсөн тул түр зогссон байна. Дэлгэрэнгүй мэдээлэл авахыг хүсвэл тусламжтай холбоо барина уу." Jakarta Sans 16px muted centered 1.5 line-height
- "Тусламж авах" (Contact support) primary Deep Navy button.
- "Гарах" (Sign out) ghost link.
```

- [x] **Account Banned**

```
A mobile account banned screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Center: X shield icon in danger red #ba1a1a, soft red glow, white ambient-shadow card.
- "Бүртгэл хаагдсан" (Account banned) Manrope Bold 22px Deep Navy
- "Таны бүртгэл манай үйлчилгээний нөхцөлийг зөрчсөн тул хаагдсан байна." Jakarta Sans 16px muted centered 1.5 line-height
- "Дэлгэрэнгүй мэдээлэл авах" (Learn more) outline button.
- "Гарах" (Sign out) ghost danger-red text link.
```

- [x] **App Update Required**

```
A mobile app update required screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold, Jakarta Sans 16px, no 1px borders, centered.

Center: download/arrow-up icon in teal on white ambient-shadow card.
- "Шинэ хувилбар гарлаа" (New version available) Manrope Bold 24px
- "Таскийн шинэ хувилбар гарсан байна. Үргэлжлүүлэхийн тулд шинэчлэх шаардлагатай." Jakarta Sans 16px muted centered 1.5 line-height
- Current version: "Одоогийн: 1.2.1" / New: "Шинэ: 1.3.0" — muted label pair
- "Шинэчлэх" (Update now) primary Deep Navy button full width.
```

- [x] **Delete Account Confirmation**

```
A mobile delete account confirmation bottom sheet for Tasky. Coastal Dusk design: white sheet over dimmed background, Manrope Bold, Jakarta Sans 16px, no 1px borders.

Bottom sheet (white, top corners 24px, ambient shadow):
- Handle bar
- Danger icon (red triangle) centered
- "Бүртгэл устгах уу?" (Delete account?) Manrope Bold 20px centered
- Warning text: "Энэ үйлдэл буцаах боломжгүй. Таны бүх мэдээлэл, захиалгын түүх устах болно." Jakarta Sans 16px muted centered 1.5 line-height
- Input field: "Баталгаажуулахын тулд 'УСТГАХ' гэж бичнэ үү" (Type DELETE to confirm) — white input, no border, floating label
- "Устгах" (Delete) danger button (#ba1a1a background, white text, full width) — enabled only when "УСТГАХ" typed
- "Цуцлах" (Cancel) ghost link below
```

- [x] **Help Screen**

```
A mobile help and support screen for Tasky. Coastal Dusk design: sandy #fdf9f4, Manrope Bold header, Jakarta Sans 16px body, no 1px borders, ambient shadows.

Header: back arrow + "Тусламж" (Help) Manrope Bold 24px.

Search bar: "Асуулт хайх..." (Search questions...) white rounded, no border.

FAQ sections (white cards, no internal dividers — spacing between questions):
Section: "Нийтлэг асуултууд" (Common questions) header muted small caps
Q: "Ажилтантай хэрхэн холбогдох вэ?" → chevron right
Q: "Захиалгыг хэрхэн цуцлах вэ?" → chevron right
Q: "Үнэлгээ хэрхэн үлдээх вэ?" → chevron right

Contact section (white card, ambient shadow):
- "Бидэнтэй холбоо барих" (Contact us) Manrope semibold 18px
- Email icon + "support@tasky.mn" link
- Chat icon + "Чатаар холбоо барих" (Chat with us) button — Deep Navy
```

### P7 — PRD Gap Fill & Phase 2 Features (YAML-Driven)

- [ ] **SCR-SHARED-004: Auth — OTP Migration Gate**

```
A mobile authentication screen for migrating Facebook-only users to phone verification (Phase 2). Follow the "Тэнгэр" (Sky) brand palette.

Layout (comfortable density):
safe_area -> centered_content(icon + heading + description + phone_input) -> bottom_cta(submit_button)

Functional requirements:
- Large Shield Icon at the top to reinforce security.
- Heading: "Утасны дугаар нэмэх" (Manrope Bold, Dark Space #1B3A5C)
- Description: "Аюулгүй байдлыг сайжруулахын тулд утасны дугаараа нэмнэ үү" (16px, Steel Gray #6BA3BE)
- Form Field: Label "Утасны дугаар", Placeholder "9911 2233", Left Icon (Phone), Helper Text "Facebook нэвтрэлтэд утасны дугаар нэмнэ".
- Submit Button (Primary xl): "Код авах"
- Skip Link (Ghost button md): "Дараа хийх"
```

- [ ] **SCR-SHARED-003: Auth — OTP Verification**

```
A mobile OTP code verification screen. Follow the "Тэнгэр" (Sky) brand palette.

Layout (comfortable density):
safe_area -> nav_header(back) -> centered_content(heading + description + otp_input + resend_link) -> bottom_cta(verify_button)

Functional requirements:
- Top Nav Header: Back arrow only.
- Heading: "Код баталгаажуулах" (Manrope Bold, Dark Space #1B3A5C)
- Description: "+976 9911-XXXX дугаар руу илгээсэн 4 оронтой кодыг оруулна уу"
- OTP Input: 4-digit code entry field blocks "- - - -" with label "Баталгаажуулах код" and helper "Таны утсанд илгээсэн 4 оронтой код".
- Resend Link (Ghost button md): "Код дахин илгээх" (or "Дахин илгээх (59 сек)").
- Verify Button (Primary xl): "Баталгаажуулах" shown at the very bottom.
```

- [ ] **SCR-CUST-007: Post Task — Review & Submit**

```
Task creation Step 7 of 7 screen for Tasky. Final review screen before publishing. Follow the "Тэнгэр" (Sky) brand palette.

Layout (default density):
safe_area -> nav_header(back + title) -> step_indicator(step 6/7) -> scrollview(summary_sections) -> sticky_bottom_cta(submit)

Functional requirements:
- Nav Header: Back arrow + "Хянах ба илгээх".
- Step Indicator: Shows step 6 out of 7, labeled "Хянах".
- Open Status Badge: "open" status badge.
- Summary Cards (Outlined variants): Sections for Category ("Ангилал"), Job Scope Summary ("Ажлын товч тайлбар"), Photos ("Зурагнууд"), Location ("Байршил"), Schedule ("Хуваарь"), Budget ("Төсөв").
- Job Scope Summary explicitly shows formatted Q&A text and an "Засах" (Edit) link.
- Sticky Bottom Action: Primary CTA xl "Даалгавар оруулах" with disclaimer text above it: "Төлбөрийг гүйцэтгэгчтэй шууд тохиролцоно".
```

- [ ] **SCR-P2-001: Credits — Balance & Purchase**

```
A mobile Wallet and Credits screen for a Tasky tasker (Phase 2). Follow the "Тэнгэр" (Sky) brand palette.

Layout (default density):
safe_area -> nav_header -> scrollview(balance_hero + pack_list + history_link) -> sticky_bottom_cta

Functional requirements:
- Nav Header: "Кредит".
- Balance Hero (Header variant): Display "Миний кредит" and a prominent integer balance (e.g., "5"). If 0, show "Кредит дууссан байна. Нэмж худалдаж аваарай".
- Pack List: Elevated cards for Credit Packs ("Кредит багцууд"):
  1. 5 credits: "5 кредит", "₮7,500", "Нэг бүрт ₮1,500"
  2. 10 credits: "10 кредит", "₮14,000", "Нэг бүрт ₮1,400"
  3. 20 credits: "20 кредит", "₮25,000", "Нэг бүрт ₮1,250" (Include "Хамгийн ашигтай" badge using Nomadic Gold #C49A3C).
- Purchase CTA (Primary lg): "Худалдаж авах".
- History Link (Ghost md): "Гүйлгээний түүх".
```

- [ ] **SCR-P2-002: Credits — QPay Payment**

```
A mobile QPay payment flow screen for Tasky credits (Phase 2). Follow the "Тэнгэр" (Sky) brand palette.

Layout (default density):
safe_area -> nav_header -> scrollview(qr_section + status_section) -> sticky_bottom_cta

Functional requirements:
- Nav Header: "Төлбөр".
- QR Section (Elevated card): Heading "QPay-ээр төлбөр хийх", instruction "QPay аппаар доорх QR кодыг уншуулна уу", a generic QR code image, and amount display "Төлбөрийн дүн: ₮14,000" using Manrope Bold 20px.
- Status Section: Open status badge "Төлбөр хүлээгдэж байна...".
- Bottom Buttons: 
  - Primary CTA lg: "QPay аппаар нээх" (Open in QPay).
  - Ghost secondary: "Буцах" (Back).
```

---

## Progress Summary

Update the counts below as you complete screens:

- **Existing Generation V1:** 42 screens
- **Remaining P7 New Generation:** 5 screens

---

## Execution Notes

- Generate **one screen at a time**. Wait for completion before starting the next.
- If a generation fails with a connection error, call `mcp__stitch__get_screen` with the screen name from the project listing before retrying.
- For screens referencing previous screens (e.g. "same nav bar as My Tasks"), view the existing screen first with `mcp__stitch__get_screen` to maintain visual consistency.
- After every 5 screens, review with `mcp__stitch__list_screens` to confirm all are appearing correctly.
- The project ID is: `1394629243985750341`
