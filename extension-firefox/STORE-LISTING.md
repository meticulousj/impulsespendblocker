# Mozilla Add-ons (AMO) Store Listing — Impulse Spend Blocker

Submit at: https://addons.mozilla.org/developers/addon/submit/
Upload: `public/impulse-blocker-firefox.zip` (passes Mozilla's validator: 0 errors)

---

## Name (max 50 chars)
Impulse Spend Blocker — Should I Buy This?

## Summary (max 250 chars — shown in search results)
Stop impulse buying at the checkout. Get an instant BUY / WAIT / SKIP verdict on any product page, see the price in hours of your work, and put purchases on a cooling-off hold with a live countdown.

## Categories
- Shopping
- Privacy & Security (secondary, optional)

## Tags / keywords (pick up to ~10; these drive search installs)
- stop impulse buying
- impulse purchase blocker
- should I buy this
- spending blocker
- save money
- budget tracker
- cooling off period
- mindful spending
- money saver
- shopping assistant

## Description (long form — paste into "Description")

**Think before you buy — right on the product page.**

Impulse Spend Blocker adds a gentle checkpoint to your online shopping. When you're about to buy something, it shows a clear verdict — BUY, WAIT, or SKIP — based on your own income and savings, so a 2 a.m. "add to cart" doesn't become next month's regret.

**What it does**

- **Instant verdicts on shopping sites** — a small card appears on product and checkout pages (Amazon, eBay, Etsy, Target, Walmart, Best Buy, Shopify stores and more) with a BUY / WAIT / SKIP recommendation.
- **See the real cost in hours** — "$349.99" is abstract. "14 hours of your work" isn't. Enter your hourly wage once and every price is translated into your time.
- **Cooling-off holds with a live countdown** — put a tempting purchase on a 24-hour, 48-hour, or 7-day hold. The extension shows the countdown right on the product page and tells you when it's time to revisit — most urges pass long before the timer does.
- **Syncs with the free web app** — holds you set in the Impulse Spend Blocker app appear in your browser automatically, and your full history, savings goals, and "money I didn't waste" dashboard live there.
- **Private by design** — your income and wage stay on your device. No account is required for the extension, no browsing data is collected, and nothing is sold. Ever.

**How it works**

1. Install the extension.
2. Click the toolbar icon and enter your monthly income and hourly wage (stored locally, never uploaded).
3. Shop normally. When a price appears, so does your verdict.

**Who it's for**

Anyone who's ever bought something in 30 seconds and thought about it for 30 days. Deal hunters who want a second opinion. Savers working toward a goal who need a speed bump between "want" and "bought."

Free to use. Optional Pro upgrade in the web app adds AI-personalized verdicts.

## Privacy policy / data disclosure
The extension collects NO personal data. Income and hourly wage are stored locally in the browser (storage permission) and never transmitted. On impulsespendblocker.lovable.app, a small bridge script reads the signed-in user's own active holds to display countdowns; no data leaves the browser.

## Homepage URL
https://impulsespendblocker.lovable.app

## Support email / site
https://impulsespendblocker.lovable.app (or your support email)

## Version notes (1.2.0)
Initial Firefox release: BUY / WAIT / SKIP verdicts on major shopping sites, hours-of-work price translation, and synced wait-period countdowns from the web app.

## Screenshots to capture before submitting (AMO requires at least 1, 1280×800 or 2400×1500)
1. The verdict card on an Amazon product page showing WAIT + hours of work
2. A hold countdown badge ("1d 2h left — Revisit …")
3. The popup with income/wage settings
4. The web app's "money saved" dashboard (shows the ecosystem)

## Reviewer notes (paste into "Notes for Reviewers")
The extension injects a content-script card on supported shopping sites that reads the product title and price from the page DOM, computes a rule-based verdict from locally stored income/wage settings, and renders it in a Shadow DOM overlay. No network requests are made except on impulsespendblocker.lovable.app, where a bridge script copies the signed-in user's active hold list (item name, price, countdown end) into extension storage via a DOM JSON element — no credentials or tokens are accessed. All innerHTML use renders locally generated, escaped strings only.
