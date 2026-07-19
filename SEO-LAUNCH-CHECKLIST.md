# Advait Consultancy — Search Visibility Playbook

**Diagnosis (2026-07-19):** The website's on-page SEO is fully in place — titles,
meta descriptions, canonicals, Open Graph, `sitemap.xml`, `robots.txt`, `llms.txt`,
and rich structured data (Organization, WebSite, ProfessionalService, FAQ, Article,
BreadcrumbList) on every page. **The reason the site does not appear in Google — even
for the exact query "Advait Consultancy" — is that the domain is new and has not been
indexed yet.** Indexing and brand-name ranking are not controlled by code; they require
the actions below, which only the site owner can perform. Do these in order. Steps 1–3
are the difference between "invisible" and "ranks #1 for its own name."

---

## 1. Google Search Console — verify + submit (do this first, ~15 min)
1. Go to https://search.google.com/search-console and add the property
   `advaitconsultancy.in` (use the **Domain** property via DNS TXT record — covers all URLs).
   - Alternative: HTML-tag method. Paste the token into the commented
     `google-site-verification` tag near the top of `index.html` and uncomment it.
2. Once verified, open **Sitemaps** and submit: `https://advaitconsultancy.in/sitemap.xml`
3. Open **URL Inspection**, enter `https://advaitconsultancy.in/`, click
   **Request Indexing**. Repeat for `/desk/`, `/notes/`, and each note URL.
4. Repeat verification for **Bing Webmaster Tools** (https://www.bing.com/webmasters) —
   this also feeds ChatGPT/Copilot search. Bing token goes in the `msvalidate.01` tag.

> Expect the brand name "Advait Consultancy" to start appearing within a few days of
> requesting indexing, and relevant long-tail keywords over the following weeks.

## 2. Entity corroboration — fill the empty `sameAs` (highest brand-ranking lever)
Google will not confidently rank a brand-new domain for its own name until it can
tie the name to a real, corroborated entity. Create these, then paste the URLs into
the two `"sameAs": []` arrays in `index.html` (see the comment block there):
- [ ] **Google Business Profile** (google.com/business) — "Advait Consultancy", category
      *Real estate consultant*, New Delhi, by-appointment. This alone often wins the
      brand query and a map/knowledge panel.
- [ ] **LinkedIn Company Page** — most trusted `sameAs` signal for a B2B advisory.
- [ ] One or two directory listings (JustDial, IndiaMART, Sulekha) — cheap corroboration.
- [ ] Optional: Instagram / X handle if the brand will use them.

## 3. First backlinks (authority — a new domain has none)
A handful of real links tells Google the site exists and is legitimate:
- [ ] The founder's personal LinkedIn + the Company Page (link to the site).
- [ ] Any professional/industry directory or association profile.
- [ ] A guest note or mention on an allied site (architecture, legal, wealth-advisory).
- [ ] Press/PR: even one local business-news mention accelerates indexing sharply.

## 4. Keep it fresh (compounds the corridor-notes strategy)
- Publish new Corridor Notes on a cadence; add each to `sitemap.xml` and the
  `notes/` index. Fresh, topical content is how you rank for keywords like
  *"Jewar airport property"*, *"YEIDA plot investment"*, *"Dwarka Expressway real estate"*.
- After adding a page, resubmit the sitemap and Request Indexing in Search Console.

## 5. Verify the setup (anytime)
- Rich Results Test: https://search.google.com/test/rich-results?url=https://advaitconsultancy.in/
- Live robots/sitemap: open `https://advaitconsultancy.in/robots.txt` and `/sitemap.xml`.
- Track "Advait Consultancy" and target keywords in Search Console → **Performance**.

---

### What was already handled in code (2026-07-19)
- Added `WebSite` schema to the homepage (brand-name signal).
- Added `Article` + `BreadcrumbList` schema and `robots`/`hreflang` meta to the Jewar dossier.
- Enriched the homepage `Organization` (foundingLocation, areaServed, knowsAbout, alternateNames)
  and made the `sameAs` gap explicit and one-step to fill.
- Cleaned `sitemap.xml` (removed the `#threshold` fragment URL, refreshed all `lastmod`
  dates, tuned `changefreq`).
- Made `robots.txt` explicitly welcome AI/answer-engine crawlers (GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended, etc.) and reference `llms.txt`.
- Added `google-site-verification` / `msvalidate.01` placeholders and geo meta.

Code cannot force Google to index or rank a new site — **steps 1–3 above are the
actual unlock.** Everything on the page is ready for them.
