# Orbit: product and integrations plan

*Status: planning document, September 2026. Nothing here is built yet, and nothing here is a
commitment. It describes the future Orbit app. This repository remains the marketing site, waitlist
and front-end demo (see `CLAUDE.md`).*

## 1. Summary

Orbit is a personal AI assistant for everyday life. Busy adults run a job, a household and a social
life from one phone, spread across a dozen apps: email, calendars, banking, bills, bookings, deliveries,
investments, fitness and tasks. Orbit connects the services they already use, pulls out what matters,
and presents it in one calm view. People can ask about their life in plain English ("What do I need to
sort before Friday?") and get an answer that shows where it came from.

The promise is simple: fewer apps to check, nothing important missed, a calmer start to the day.

This plan covers the principles, the features, which apps and services can realistically be
integrated (researched September 2026), a phased roadmap, a high-level architecture, the security and
compliance work, and the main risks.

## 2. Product principles

1. **Read first.** Orbit reads and summarises. Any action (sending an email, adding an event, setting a
   reminder) is proposed and only happens after the person confirms it. Nothing is ever sent silently.
2. **The person controls every connection.** Connect or disconnect any source at any time, see what
   each source is used for, and delete Orbit's copy of the data.
3. **Least privilege.** Ask for the narrowest scope that does the job (read-only wherever possible;
   selected folders or labels where the provider supports it).
4. **Minimise and expire.** Store derived facts (a bill, a booking, a due date) rather than whole
   mailboxes where possible, and set retention periods.
5. **Show your working.** Every answer and briefing item cites its source ("From your Gmail, 12 Oct",
   "From Monzo, pending"). If Orbit is unsure, it says so.
6. **Help, don't advise.** Orbit shows money and investment information; it does not give financial
   advice, recommend products or trade. Health data is for wellbeing, not medical guidance.
7. **Honest status.** The website and app only describe integrations as available once they are, and
   make no security or compliance claims until they are earned and verifiable.

## 3. Core features

| Feature | What it does | Main data | Phase |
| --- | --- | --- | --- |
| **Ask Orbit** | Natural-language questions across connected sources, answered with citations. "When is the car insurance due?" "What did Priya ask me for?" | All connected sources | MVP (email + calendar), grows each phase |
| **Daily briefing** | A morning summary: today's schedule, emails that need a reply, bills due soon, travel, deliveries | Calendar, email, bills, bookings | MVP |
| **Life inbox** | Surfaces important emails, flags replies needed, suggests drafts (never auto-sends), hides noise | Email | MVP |
| **Calendar** | One view across Google, Microsoft and iCloud calendars; conflicts, travel buffers; create events with confirmation | Calendars | MVP (read), Phase 4 (write) |
| **Bookings and travel** | Trips assembled automatically from confirmations: flights, hotels, trains, restaurants; check-in and departure reminders | Email, calendar, flight status | MVP |
| **Money** | Balances, upcoming bills, subscriptions and renewals, spending by category, unusual charges | Open banking, billing emails | Phase 2 |
| **Investments** | Portfolio overview across brokers and ISAs, performance over time. Read-only, no advice | Brokerage aggregators | Phase 2 |
| **Orders and deliveries** | Online orders from receipts, delivery tracking, returns windows | Email, carrier tracking | Phase 2 |
| **Tasks and reminders** | Tasks extracted from emails and messages; two-way sync with task apps | Email, task apps | Phase 3 |
| **Health and fitness** | Activity, sleep and workout summaries in the briefing | Health platforms, fitness apps | Phase 3 |
| **Documents and renewals** | Key dates: passport, driving licence, insurance, MOT, TV licence, warranties | Email, manual entry, uploads | Phase 3 |
| **Smart notifications** | One digest instead of many pings; quiet hours; only urgent items interrupt | Everything above | Phase 1 onwards |
| **Your business** | For people who run a shop or side business: revenue today, this week and this month, orders to fulfil, payouts on the way, low stock, all alongside the rest of their life. Read-only | Shopify, Stripe, Etsy, Square, eBay, Amazon, accounting apps | Phase 2 |
| **Shared spaces** | Optional household view for shared bills, plans and deliveries | Opt-in per item | Phase 4 |

## 4. Integration catalogue

Access routes:
- **API**: the provider's official API.
- **Aggregator**: a licensed third party that connects many providers (open banking, brokerages).
- **Email**: extracted from confirmation, receipt or billing emails in a connected mailbox.
- **On-device**: read on the phone through an OS framework; data needn't leave the device.

Priority: **MVP** (private beta), **v1** (public launch), **Later**, or **No** (not planned).

### 4.1 Email

| Service | Route | Orbit reads / writes | Notes and gating | Priority |
| --- | --- | --- | --- | --- |
| Gmail / Google Workspace | Gmail API (OAuth) | Read messages and labels; later drafts | `gmail.readonly` is a Google **restricted** scope: OAuth verification plus an annual CASA security assessment (several weeks, recurring cost). `gmail.send` is "sensitive" only. Push updates via Pub/Sub watch. | MVP |
| Outlook.com, Hotmail, Microsoft 365 | Microsoft Graph Mail (OAuth) | Read mail; later drafts | Publisher verification; admin consent may be needed for work accounts. Change notifications for sync. | MVP |
| iCloud Mail | IMAP with app-specific password | Read | No OAuth; the person creates an app-specific password. Clunkier onboarding. | v1 |
| Yahoo, AOL | IMAP (OAuth where offered) | Read | Lower priority by audience. | Later |
| Fastmail, Proton (via Bridge), others | IMAP / JMAP | Read | Long tail; generic IMAP connector. | Later |

### 4.2 Calendars

| Service | Route | Orbit reads / writes | Notes | Priority |
| --- | --- | --- | --- | --- |
| Google Calendar | Google Calendar API | Read; Phase 4 create/edit with confirmation | Sensitive scope (verification, no CASA). | MVP |
| Outlook / Microsoft 365 calendar | Microsoft Graph Calendar | Read; later write | Same app registration as mail. | MVP |
| iCloud Calendar | CalDAV with app-specific password; on iOS, EventKit on-device | Read | EventKit gives a smoother iOS path. | v1 |
| Any CalDAV / .ics feed | CalDAV, ICS subscription | Read | School, sports club and work rota feeds. | v1 |
| Calendly, Cal.com | API | Read bookings | Mostly for self-employed users. | Later |

### 4.3 Banking and cards (UK and EU first)

Orbit reads balances and transactions through **account information services (AIS)** under open
banking. It never moves money.

| Route | Coverage | Notes | Priority |
| --- | --- | --- | --- |
| **TrueLayer** | UK and EU banks | Strong UK coverage; Orbit can operate as an agent under TrueLayer's licence or hold its own. | Phase 2 (choose one) |
| **Yapily** | UK and EU | "Yapily Connect" lets Orbit use Yapily's licence without its own eIDAS certificates. | Phase 2 (alternative) |
| **Enable Banking** | EU and UK | Self-serve sign-up; restricted production mode for testing with your own accounts. | Phase 2 (alternative) |
| **Plaid** | US and Canada (also UK/EU) | For US expansion. | Phase 4 |
| GoCardless Bank Account Data | UK/EU | **Stopped accepting new sign-ups in July 2025.** Not an option. | No |

Banks reachable through these aggregators include Monzo, Starling, Revolut, Barclays, HSBC, Lloyds,
Halifax, NatWest, RBS, Santander, Nationwide, Chase UK, TSB, first direct, American Express and
Barclaycard. Coverage and data quality vary by bank and must be checked per aggregator.

Notes:
- Monzo's own Developer API is **personal use only**. Third parties reach Monzo through its Open
  Banking AIS API via an authorised provider.
- Open banking consent has to be renewed periodically. The app must make re-consent painless.
- Regulation: to access account data Orbit needs FCA authorisation as an AISP, or to act as an agent
  under an aggregator's licence (see section 8).

### 4.4 Investments, pensions and crypto

| Service | Route | Reads | Notes | Priority |
| --- | --- | --- | --- | --- |
| **SnapTrade** (aggregator) | API | Holdings, balances, transactions | Connects many brokerages, including Trading 212, Vanguard (read-only; Vanguard has no public API of its own) and Interactive Brokers. Check UK coverage (e.g. Freetrade, Hargreaves Lansdown, AJ Bell) before relying on it. | Phase 2 |
| **Trading 212** | Public API (API key) | Positions, cash, orders history | Works for Invest and Stocks ISA accounts, not SIPP. Keys can be read-only. Useful fallback if an aggregator lacks it. | Phase 2 |
| Plaid Investments | API | Holdings, transactions | US brokerages. | Phase 4 |
| Coinbase, Kraken | Read-only API keys / OAuth | Balances | Optional; show value only. | Later |
| Workplace and private pensions | Manual entry, statement upload | Balances | No consumer API today; revisit as open finance and the UK pensions dashboards develop. | Later |
| Property, cars, other assets | Manual entry | Values | Only if people ask for a full net-worth view. | Later |

### 4.5 Bills and subscriptions

There are very few direct utility APIs, so Orbit does not depend on them. Instead it combines:
- **Recurring payments from open banking** (direct debits, standing orders, card subscriptions), and
- **Billing emails** (energy, water, broadband, mobile, council tax, insurance, streaming, gyms).

The result is one list of what's coming out and when, with renewals and price rises flagged. Orbit
does not switch providers or cancel on someone's behalf. Later it could link to the provider's own
cancellation page.

### 4.6 Shopping, orders and deliveries

| Source | Route | Notes | Priority |
| --- | --- | --- | --- |
| Shopify stores, Amazon, eBay, ASOS, Etsy, supermarkets and other retailers | Email (order confirmations, dispatch and delivery emails) | There is **no consumer-side, cross-store Shopify API**: the Customer Account API is scoped to each store's own storefront. Email covers every retailer at once. | Phase 2 |
| Carrier tracking: Royal Mail, Evri, DPD, DHL, UPS, Parcelforce, Yodel, InPost | Tracking aggregator API (e.g. AfterShip, 17TRACK) | Takes tracking numbers found in emails and returns live status. | Phase 2 |
| Your own Shopify store | Shopify Admin API | That's the seller view, covered in 4.13. | Phase 2 |

### 4.7 Travel and bookings

Most travel companies have no consumer API, so Orbit builds trips from **confirmation emails**, as
TripIt does, then enriches them with live data.

| Source | Route | Notes | Priority |
| --- | --- | --- | --- |
| Airlines (BA, easyJet, Ryanair, Jet2, Virgin, etc.) | Email | Flight numbers, times, booking references. | MVP |
| Flight status | Aviation data API (e.g. FlightAware AeroAPI, Cirium) | Delays, gates, changes. Paid per call. | v1 |
| Hotels and stays: Booking.com, Airbnb, Expedia, Hotels.com, direct hotels | Email | Airbnb and Booking.com have no public guest-side API. | MVP |
| Trains and coaches: Trainline, LNER, Avanti, National Express | Email | Later: live running data from National Rail feeds. | v1 |
| Restaurants: OpenTable, SevenRooms, Resy, direct bookings | Email + calendar invites | | MVP |
| Events and tickets: Ticketmaster, AXS, Eventbrite, DICE | Email | | v1 |
| Wallet passes (Apple Wallet, Google Wallet) | On-device / share sheet | Boarding passes and tickets. | Later |
| TripIt | API | Optional import for existing TripIt users. | Later |

### 4.8 Tasks and notes

| Service | Route | Reads / writes | Priority |
| --- | --- | --- | --- |
| Todoist | API | Two-way tasks | Phase 3 |
| Microsoft To Do | Microsoft Graph | Two-way tasks | Phase 3 |
| Google Tasks | Google Tasks API | Two-way tasks | Phase 3 |
| Apple Reminders | EventKit (iOS, on-device) | Two-way | Phase 3 |
| Notion | API | Read selected pages; add tasks to a chosen database | Later |
| Things | URL scheme | Write only (add tasks) | Later |

### 4.9 Health and fitness

| Service | Route | Reads | Notes | Priority |
| --- | --- | --- | --- | --- |
| Apple Health | HealthKit (iOS, on-device) | Steps, workouts, sleep | Data can stay on the device. | Phase 3 |
| Android | Health Connect (on-device) | Steps, workouts, sleep | Replaces Google Fit on Android. | Phase 3 |
| Fitbit / Google | Google Health API (cloud; the former Fitbit Web API) | Activity, sleep | | Phase 3 |
| Google Fit | | | **APIs deprecated**: no new sign-ups since May 2024; support ends in 2026. Not used. | No |
| Strava | API | Activities | | Phase 3 |
| Garmin Connect | Partner programme (Health / Activity API) | Activities, sleep | Needs an approved business application. | Later |
| Oura, Whoop | APIs | Sleep, readiness, recovery | | Later |

### 4.10 Messaging and work tools

| Service | Route | Notes | Priority |
| --- | --- | --- | --- |
| Slack | API (OAuth) | Mentions and DMs that need a reply. | Later |
| Microsoft Teams | Microsoft Graph | Same, for work accounts (may need admin consent). | Later |
| WhatsApp, iMessage, Instagram DMs, Messenger, Telegram personal chats | None | **No API for personal chats** (WhatsApp's API is for businesses only). Not supported. The person can share a message to Orbit from the share sheet. | No |

### 4.11 Files and documents

| Service | Route | Use | Priority |
| --- | --- | --- | --- |
| Google Drive | Drive API (per-file picker scope where possible) | Answer questions from chosen documents (policies, tenancy, warranties) | Later |
| OneDrive | Microsoft Graph | Same | Later |
| Dropbox | API | Same | Later |
| Upload (PDF, photo) | In-app | Scan a letter or policy; Orbit extracts key dates | Phase 3 |

### 4.12 Your business (shop owners and side hustles)

The "Your business" feature: a seller connects their store and Orbit shows sales, orders to fulfil,
payouts and stock in the briefing and in Ask Orbit ("How did the shop do this week?"). Read-only:
Orbit never edits products, refunds or fulfils orders.

| Service | Route | What Orbit reads | Gating and effort | Priority |
| --- | --- | --- | --- | --- |
| **Shopify** | Admin GraphQL API via a **public Shopify app** that the merchant installs (OAuth) | Orders and totals (revenue, refunds, AOV), products and inventory levels, payouts (Shopify Payments), analytics via ShopifyQL where the scope allows | Register as a Shopify Partner and pass **App Store review**. `read_orders` returns the **last 60 days** by default; older history needs the protected `read_all_orders` scope, which Shopify must approve. Customer names, emails and addresses are **protected customer data** needing separate approval, so request only order totals and dates, not customer fields, and the review is simpler. New public apps must use the GraphQL Admin API (REST is legacy). | Phase 2 |
| **Stripe** (people selling via their own site, SaaS, Gumroad-style) | Stripe Connect OAuth with the `read_only` scope, or a Stripe App | Charges, balance, payouts, subscriptions (MRR) | Straightforward OAuth; read-only is the default scope. | Phase 2 |
| **Etsy** | Etsy Open API v3 (OAuth, `transactions_r`, `shops_r`) | Receipts (orders), revenue, listings | App keys are reviewed manually (usually days). **Commercial access** is needed to serve many sellers; buyer email needs a separate request, which Orbit doesn't need. | Phase 2 |
| **Square** | Square API (OAuth) | Payments, orders, payouts, inventory | Easy OAuth; good for market stalls, cafés, salons. | Phase 3 |
| **eBay** | eBay Sell APIs (Fulfillment, Finances) with user OAuth | Orders, payouts, fees | Developer account and production keys; straightforward. | Phase 3 |
| **Amazon (sellers)** | Selling Partner API | Orders, sales, settlements | Heavier: SP-API developer registration and Amazon's data protection requirements; restricted data (buyer PII) needs extra approval, which Orbit doesn't need. | Later |
| **WooCommerce** | REST API with keys the store owner generates | Orders, revenue | Per-store setup; easy but manual. | Later |
| **PayPal (business)** | Transaction Search API | Sales and payouts | Third-party access is limited; often simpler via CSV upload or the bank feed. | Later |
| **TikTok Shop** | TikTok Shop Partner API | Orders, settlements | Partner application; UK available. | Later |
| **Gumroad, Lemon Squeezy, Ko-fi** | APIs / webhooks | Sales | Small but loved by creators. | Later |
| **Xero, QuickBooks, FreeAgent** | OAuth APIs | Profit and loss, invoices due, VAT and Self Assessment dates | Easy OAuth; FreeAgent is popular with UK sole traders. Gives the "what do I owe HMRC and when" view. | Phase 3 |

Design notes:
- Business numbers stay separate from personal money by default, with an optional combined view.
- Headline figures are simple (sales, orders, payouts, refunds) and always say which source and
  period they cover. No forecasting or tax advice.

### 4.13 More integrations to consider

Grouped by the life area they help with. "Easy" means self-serve keys or OAuth; "Gated" means a
review, partnership or fee.

| Area | Service | Route | What it adds | Effort |
| --- | --- | --- | --- | --- |
| **Car** | DVLA Vehicle Enquiry Service | Free API key (application reviewed) | Tax status, MOT expiry, vehicle details from a registration number | Easy |
| | DVSA MOT history API | Registration required (new API since Sept 2025) | MOT results, advisories, mileage history | Gated (light) |
| | Tesla Fleet API, other EV apps | OAuth | Charge level, charging sessions | Later |
| **Home and energy** | Octopus Energy API | Customer's own API key | Half-hourly usage, tariff and cost | Easy (paste a key) |
| | n3rgy / Glowmarkt (Hildebrand) | Consent via meter details | Smart-meter usage for any supplier | Gated, reliability varies |
| | Google Nest (Device Access) | Programme with a one-off fee | Thermostat, doorbell events | Later |
| **Getting around** | TfL Unified API | Free key | Tube and bus status, journey times for London commutes | Easy |
| | National Rail (Darwin) | Free registration | Live train times for booked journeys | Easy |
| | Google Maps Routes API | Paid per call | Leave-by times between calendar events | Easy |
| | Met Office DataHub | Free tier | Weather in the morning briefing | Easy |
| **Health** | Withings | OAuth | Weight, blood pressure, sleep | Easy |
| | NHS App / NHS login | Partner programme only | Appointments, prescriptions | Gated; use appointment emails instead |
| **Money with others** | Splitwise | OAuth | Shared expenses and who owes whom, for couples and housemates | Easy |
| **Work and side projects** | Asana, Trello, Jira, Linear, ClickUp, Monday | OAuth | Tasks due and mentions, in the briefing | Easy |
| | Zoom | OAuth | Meeting links and recordings for calendar events | Easy |
| **Going out** | Ticketmaster Discovery, Eventbrite | API keys / OAuth | Tickets and events (plus confirmation emails) | Easy |
| **Photos** | Google Photos | Picker API only | Picking a photo (e.g. a receipt) to hand to Orbit; since March 2025 apps can't read a whole library | Limited |
| **Notes** | Evernote, Obsidian (local files) | API / file import | Search across notes in Ask Orbit | Later |
| **Education** | Google Classroom | OAuth (school-managed accounts) | Homework due for older children | Later; school emails cover most |

Not worth chasing (no usable API): Apple Notes, Goodreads (API closed), ClearScore/Experian credit
scores, Tesco Clubcard and other loyalty schemes, school apps such as ClassDojo or ParentPay (use
their emails), Headspace and most wellbeing apps.

### 4.14 Everything else

| Service | Plan |
| --- | --- |
| Uber, Bolt, Deliveroo, Just Eat, Uber Eats | Email receipts only (spend and trip history). No live integration. |
| Spotify, Netflix, Disney+ and other streaming | Treated as subscriptions (bank + email). No content integration. |
| Council services, DVLA, HMRC | Dates from emails and letters (uploads), plus manual reminders. |
| Smart home (Google Home, Alexa, HomeKit) | Not planned. |

## 4b. Quick reference: easy, gated and workarounds

**Easy** (self-serve OAuth or API keys, light review): Google Calendar, Outlook/Microsoft 365 mail and
calendar, Todoist, Microsoft To Do, Google Tasks, Notion, Slack, Strava, Stripe, Square, Xero,
QuickBooks, FreeAgent, Dropbox, Trading 212 (API key), carrier tracking via AfterShip.

**Doable with a review or partnership** (plan weeks, sometimes costs): Gmail (restricted scope,
annual CASA assessment), Shopify (App Store review; 60-day order limit without `read_all_orders`),
Etsy (manual key approval, commercial access), eBay, banks via TrueLayer/Yapily/Enable Banking (plus
FCA route), SnapTrade, Garmin (partner programme), Amazon SP-API, TikTok Shop, flight data APIs.

**No usable API, and the workaround:**

| App | Workaround |
| --- | --- |
| WhatsApp, iMessage, Instagram/Facebook DMs | Share sheet: forward a message or screenshot to Orbit. Orbit reads confirmations these apps send by email where they exist. |
| Airbnb, Booking.com, Expedia, airlines, Trainline, OpenTable | Confirmation emails (schema.org markup + templates), calendar invites, Wallet passes, forwarding address. |
| Amazon (as a shopper), ASOS, supermarkets, any Shopify store you *buy* from | Order and dispatch emails, then carrier tracking. |
| Uber, Bolt, Deliveroo, Just Eat | Receipt emails for spend; bank feed for recurring use. |
| Netflix, Spotify, Disney+, gyms | Treated as subscriptions from bank transactions and billing emails. |
| Vanguard (direct), most pension providers | SnapTrade where covered; otherwise statement upload or manual balance with a reminder to update. |
| Utilities, council tax, HMRC, DVLA | Billing emails, bank direct debits, uploads of letters, manual key dates. |
| Monzo's own API (personal only) | Standard open banking through an aggregator. |
| Google Fit (shutting down) | Health Connect, Apple HealthKit, Google Health API. |
| Any service without email or API | Manual entry, CSV import, or photo/PDF upload with extraction. |

## 5. Data sources beyond APIs

- **Email extraction pipeline.** In order:
  1. Structured markup many senders include (schema.org `FlightReservation`, `LodgingReservation`,
     `Order`, `ParcelDelivery`, `Invoice`).
  2. Sender-specific templates for the most common UK senders.
  3. A language-model fallback with confidence scores.

  Low-confidence items are shown as suggestions, not facts.
- **Calendar invites** (.ics attachments) for bookings and appointments.
- **Forwarding address.** Each person gets a private address to forward anything to, for people who
  won't connect a whole mailbox.
- **Share sheet** on iOS and Android: share a message, screenshot, PDF or link to Orbit.
- **Manual entry** for things with no digital trail (passport expiry, boiler service).
- **Uploads**: photos or PDFs of letters, policies and statements.

## 6. Roadmap

### Phase 0: Pre-launch (now)
Marketing site, 3D story, waitlist, clickable demo (this repository). Recruit beta users from the
waitlist, and interview them about which apps they would connect first.

### Phase 1: Private beta (MVP)
- **Connections:** Gmail, Outlook/Microsoft 365, Google Calendar, Microsoft calendar.
- **Features:** daily briefing, Life inbox, bookings and travel from email, Ask Orbit over email and
  calendar, smart notifications.
- **Platforms:** web app and iOS.
- **Workstreams:**
  - Start Google OAuth verification and the CASA assessment early; they gate Gmail.
  - Complete Microsoft publisher verification.
  - Do the privacy groundwork (section 8).
- **Exit criteria:** most beta users connect at least two sources; the briefing is opened on most
  weekdays; answer accuracy meets an agreed bar in spot checks.

### Phase 2: Money and orders
- **Open banking:** pick one aggregator after comparing coverage, cost per connected user and the
  licensing route. UK first.
- **Money features:** bills and subscriptions (bank + email), balances and spending.
- **Investments:** SnapTrade, plus Trading 212 direct if needed.
- **Your business:** Shopify (public app review started early in the phase), Stripe and Etsy.
- **Orders and deliveries:** from email plus carrier tracking.
- **Exit criteria:** bills list matches reality for most testers; re-consent flow works; no incorrect
  balances shown.

### Phase 3: Everyday life
- **Integrations:** iCloud mail and calendar; health and fitness (HealthKit, Health Connect, Google
  Health API, Strava); task sync (Todoist, Microsoft To Do, Google Tasks, Apple Reminders); business
  add-ons (Square, eBay, Xero, QuickBooks, FreeAgent).
- **Features:** documents and renewals, uploads.
- **Platforms:** Android app.

### Phase 4: Assist and expand
- **Actions** (confirmation always required): draft replies, add events, set reminders.
- **Household:** optional shared spaces.
- **US expansion:** via Plaid and Plaid Investments.
- **Work tools:** Slack and Teams.
- **Evaluate:** Amazon SP-API, TikTok Shop, WooCommerce, Garmin, Oura, Whoop.

## 7. Architecture outline (future product, not this repo)

- **Connectors layer.**
  - One connector per source, with an encrypted token vault (per-user keys, short-lived access
    tokens, refresh handled server-side).
  - Incremental sync workers.
  - Webhooks where offered: Gmail watch via Pub/Sub, Microsoft Graph change notifications,
    aggregator webhooks.
- **Normalised data model.** Person, Message, Event, Transaction, Bill, Subscription, Holding,
  Booking, Order, Shipment, Task, Activity, Document. Each record keeps a link back to its source for
  citations and deletion.
- **Extraction pipeline.** Structured markup, then templates, then model fallback, with confidence
  scores and human-visible provenance.
- **Retrieval and assistant layer.**
  - Answers are built only from the requesting person's data.
  - Permission checks run per source at query time.
  - Every claim cites a record; nothing is invented when data is missing.
  - Answers stay within the "no advice" rule for money and health.
- **Mobile.** On-device frameworks (HealthKit, Health Connect, EventKit) where possible, sending only
  summaries to the server.
- **Deletion and export.** Disconnecting a source deletes its data; account deletion removes
  everything; export on request.
- **Observability.** Sync health per connector, so broken connections are surfaced to the person
  quickly.

## 8. Security, privacy and compliance workstream

This is work to do, not claims. Nothing here should appear on the website until it is complete and
verifiable.

- **Google:** OAuth app verification for sensitive scopes, and restricted-scope verification plus an
  **annual CASA assessment** for Gmail read access. Plan for recurring cost and weeks of lead time.
  Consider processing on-device, which may change what is assessed; confirm with Google before relying
  on it.
- **Microsoft:** publisher verification; plan for tenant admin consent on work accounts.
- **UK GDPR and Data Protection Act 2018:**
  - ICO registration.
  - Lawful basis for each processing purpose.
  - Data protection impact assessment (the data is high-risk: email, finance, health).
  - Retention schedule, processor agreements and a clear privacy notice.
  - Health data is special-category data, so explicit consent is needed.
- **FCA:** decide between full AISP authorisation and operating as an agent under the chosen
  aggregator's licence; build the consent and re-consent journeys the rules require.
- **AI and data use:** no training on customer data without explicit opt-in; keep prompts and outputs
  covered by the retention policy.
- **Security:** threat model, independent penetration tests before beta and launch, secrets
  management, least-privilege infrastructure access, incident response plan. Consider SOC 2 or
  ISO 27001 once there are business customers.

## 9. Risks and open questions

| Risk | Mitigation |
| --- | --- |
| A provider withdraws or restricts API access (as GoCardless did with new sign-ups) | Keep connectors behind one interface; have a second aggregator evaluated; email as the fallback route. |
| Google verification or CASA delays the beta | Start early; launch with Outlook if Gmail slips; consider on-device processing. |
| Email extraction mistakes (wrong date, wrong amount) | Confidence scores, sources shown, easy corrections, suggestions rather than facts when unsure. |
| The assistant states something wrong | Answers only from cited records; says "I couldn't find that" rather than guessing; never acts without confirmation. |
| People are wary of connecting email and bank accounts | Start with calendar and one mailbox; show exactly what is read; per-source disconnect; forwarding-address option. |
| Aggregator costs per user | Model unit economics before choosing; connect money sources only for people who use Money. |
| Regional coverage | UK first; confirm aggregator and brokerage coverage before any market launch. |
| Scope creep | Hold to the phase plan; each phase has exit criteria. |

Open questions:
- Which market after the UK: EU or US?
- Pricing: free tier plus subscription, and which features sit behind it?
- Web-first or mobile-first for the beta?
- Own AISP authorisation or an agent arrangement?

## 10. Keeping the marketing site honest

The site's integration tiles live in `src/data/integrations.ts`. Their statuses ("In development",
"Planned", "Coming soon") should follow this plan and must stay honest (CLAUDE.md rule 4). Only mark
something as available once real users can connect it. Specifically:
- Gmail and Google Calendar can stay "In development" while Phase 1 is under way.
- Banking and travel should say "Coming soon" only once Phase 2 is scheduled.

## 11. Sources

Research done in September 2026. Re-check before relying on any of it, since provider terms change.

- Google, restricted scope verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- Gmail API scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- GoCardless, Bank Account Data new sign-ups disabled: https://bankaccountdata.gocardless.com/new-signups-disabled
- Open Banking Tracker, open banking API providers for developers in 2026: https://www.openbankingtracker.com/blog/best-open-banking-api-providers-developers-2026
- GoCardless Bank Account Data alternatives (Enable Banking, Yapily Connect): https://dev.to/johnfrandsen/gocardless-bank-account-data-alternatives-what-to-use-when-signups-are-disabled-326d
- Monzo API reference (personal use) and Open Banking API: https://docs.monzo.com/ and https://docs.monzo.com/open-banking/
- SnapTrade brokerage integrations: https://snaptrade.com/brokerage-integrations
- SnapTrade and Vanguard: https://snaptrade.com/brokerage-integrations/vanguard-api
- Trading 212 Public API: https://docs.trading212.com/api
- Trading 212 API key help article: https://helpcentre.trading212.com/hc/en-us/articles/14584770928157-Trading-212-API-key
- Google Fit migration FAQ (Health Connect, Google Health API): https://developer.android.com/health-and-fitness/health-connect/migration/fit/faq
- Shopify Customer Account API: https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api
- Shopify API access scopes: https://shopify.dev/docs/api/usage/access-scopes
- Shopify protected customer data: https://shopify.dev/docs/apps/launch/protected-customer-data
- Shopify approval for orders older than 60 days: https://www.cleverence.com/articles/shopify-dev-documentation/apps-now-need-shopify-approval-to-read-orders-older-than-60-3815/
- Stripe Connect OAuth reference: https://docs.stripe.com/connect/oauth-reference
- Etsy Open API v3 authentication: https://developer.etsy.com/documentation/essentials/authentication/
- DVSA MOT history API: https://dvsa.github.io/mot-history-api-documentation/
- DVLA Vehicle Enquiry API guide: https://paul-walsh.co.uk/dvla-vehicle-enquiry-api-guide/
- Google Photos API updates (March 2025): https://developers.google.com/photos/support/updates
- Octopus Energy API guide: https://www.guylipman.com/octopus/api_guide.html
- Smart meter data access (n3rgy, Glowmarkt): https://www.smartme.co.uk/meter-data
