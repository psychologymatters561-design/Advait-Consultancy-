#!/usr/bin/env python3
"""Static site builder for advaitconsultancy.in.

Content lives in _src/content/*.txt: a short header (key: value lines), a line
with ---, then a light markup body. Run `python3 _src/build.py`. It writes every
page, sitemap.xml, assets/contours.svg and _src/REPORT.md, then prints the QA
results. Existing /notes/ and /desk/ pages are never written to.
Jekyll skips folders that start with an underscore, so _src never ships.
"""
import hashlib, html, json, math, pathlib, re, sys
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "_src" / "content"
SITE = "https://advaitconsultancy.in"
TODAY = "2026-10-12"
WHATSAPP = "919650650178"
EMAIL = "advisory@advaitconsultancy.in"
OG = SITE + "/og.png"

SERVICES = [
    ("landowner-advisory", "Landowner advisory", "Landowner-side counsel on joint development, collaboration and sale."),
    ("land-acquisition", "Land acquisition", "Client-side sourcing, diligence and structuring."),
    ("permission", "Permission", "Change of land use, non-agricultural declaration and approvals strategy."),
    ("value-design", "Value design", "What the land should become, who runs it, and how it is governed."),
    ("family-land", "Family land", "Stewardship of inherited and multi-heir holdings."),
    ("nri-land", "NRI land counsel", "Land counsel for NRIs from North Indian families."),
]
REGIONS = [
    ("gurugram", "Gurugram"), ("delhi", "Delhi"), ("noida-greater-noida", "Noida / Greater Noida"),
    ("faridabad", "Faridabad"), ("sohna", "Sohna"), ("sonipat", "Sonipat"), ("panipat", "Panipat"),
    ("karnal", "Karnal"), ("panchkula-tricity", "Panchkula / Tricity"),
    ("yamuna-expressway", "Yamuna Expressway"), ("himachal", "Himachal Pradesh"),
]
# The thirteen equal places of brief section 4, in its order. None is highlighted.
STRIP = [
    ("Delhi", "/regions/delhi/"), ("Gurugram", "/regions/gurugram/"),
    ("Dwarka Expressway", "/regions/gurugram/#dwarka-expressway"),
    ("Southern Peripheral Road", "/regions/gurugram/#southern-peripheral-road"),
    ("Sohna", "/regions/sohna/"), ("Faridabad", "/regions/faridabad/"),
    ("Noida / Greater Noida", "/regions/noida-greater-noida/"),
    ("Yamuna Expressway", "/regions/yamuna-expressway/"), ("Sonipat", "/regions/sonipat/"),
    ("Panipat", "/regions/panipat/"), ("Karnal", "/regions/karnal/"),
    ("Panchkula / Chandigarh Tricity", "/regions/panchkula-tricity/"),
    ("Himachal Pradesh", "/regions/himachal/"),
]
DEVS = [("dlf", "DLF"), ("godrej-properties", "Godrej Properties"), ("m3m", "M3M"),
        ("signature-global", "Signature Global"), ("max-estates", "Max Estates")]

FEES = [
    ("Ground Session", "₹15,000", "60–75 minutes. Credited in full against any mandate."),
    ("Land Value Brief", "from ₹75,000", "One parcel, read properly. Credited."),
    ("Mandate", "1–2%", "Of transaction value, minimum ₹2 lakh. Agreed in writing before work begins."),
    ("Value design", "Shared upside", "Above the return you agree with us. Agreed per project."),
]

PRINCIPAL = [
    "I have worked in real estate since 2021 — Delhi, Gurugram, Noida, Faridabad, Panipat, Panchkula. I watched families hold the right land for years and do nothing with it, waiting for someone else's expressway to give it a value.",
    "Land is the one asset in India most people own without a plan. Advait exists to give it one: read where the country is building, secure what the land is allowed to become, and design something on it worth travelling to.",
    "I have acted for investors under power of attorney. Their names stay with them, as yours would. Discretion here is not a policy. It is the service.",
    "We will not be the right counsel for most people who write to us. That is not a posture. It is how the work stays good.",
]

FOOT_LINE = "If you are holding a problem with land — or the patience to do it properly — <em>we should speak.</em>"
CLOSE_LINE = "Found something here that touches your land? Bring us the problem; we'll work out the best answer."
LEGAL = ("Advait Consultancy publishes general information on this site. It is not investment, legal or tax advice, "
         "and no advisory relationship exists until a mandate is signed. Illustrations show logic, not forecasts. "
         "Real estate is illiquid and its value can fall. Nothing here is an offer or solicitation to invest.")

BANNED = ["luxury", "luxurious", "premium", "exclusive", "elite", "ultra", "world-class", "best-in-class", "best",
          "top", "leading", "#1", "guaranteed", "assured", "high returns", "ROI", "hot", "prime", "dream", "booking",
          "book now", "hurry", "limited offer", "don't miss", "HNI", "UHNI", "wealthy", "rich", "old money", "affluent",
          "rare opportunity", "unmatched", "unparalleled", "seamless", "curated", "bespoke", "elevate", "unlock", "journey"]
# Stock and AI-tell words from the copy gate. "working landscapes" is a named brand category, so it is allowed.
TELLS = ["leverage", "empower", "robust", "actionable", "data-driven", "solutions", "testament", "delve", "landscape"]

TV = []      # (page path, note) for every TODO-VERIFY marker
FAQS = {}    # page path -> [(q, a)]


def wa(text):
    return f"https://wa.me/{WHATSAPP}?text={quote(text)}"


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def link(text, url):
    ext = url.startswith("http")
    rel = ' rel="noopener"' if ext else ""
    return f'<a href="{url}"{rel}>{text}</a>'


def inline(s, page):
    s = html.escape(s, quote=False)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: link(m.group(1), m.group(2)), s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", s)

    def tv(m):
        TV.append((page, html.unescape(m.group(1).strip())))
        return "<!-- TODO-VERIFY -->"
    return re.sub(r"\{tv:([^}]*)\}", tv, s)


def btns(primary=True, wa_text="Hello Advait. I would like to bring a question about land."):
    out = '<a class="btn btn-solid" href="/engage/">Before we speak →</a>'
    return out + f' <a class="btn btn-line" href="{wa(wa_text)}" data-wa="{html.escape(wa_text)}">Write on WhatsApp</a>'


# ---------- components ----------

def c_fees():
    cells = "".join(
        f'<div class="fee"><p class="mono">{n}</p><p class="fee-fig">{f}</p><p class="small">{t}</p></div>'
        for n, f, t in FEES)
    return (f'<div class="cells c4 rv">{cells}</div>'
            '<div class="honest rv"><p class="mono">The honest version</p>'
            '<p>Yes, the mandate fee is a percentage. The difference is who pays it: only you, agreed in writing, before we begin.</p></div>')


def c_regions():
    items = "".join(f'<li><a href="{u}"><span class="mono">{i:02d}</span>{n}</a></li>' for i, (n, u) in enumerate(STRIP, 1))
    items += '<li class="all"><a href="/regions/">All regions →</a></li>'
    return f'<ul class="strip rv" role="list">{items}</ul>'


def c_principal():
    paras = "".join(f"<p>{p}</p>" for p in PRINCIPAL)
    return ('<div class="note-grid rv"><figure class="portrait" aria-label="Portrait of the Principal, to follow">'
            '<span aria-hidden="true">A</span></figure>'
            f'<div class="letter">{paras}<p class="sign">— Arjun Dixit · Principal · New Delhi</p></div></div>')


def c_study():
    return ('<form class="study rv" data-study>'
            '<label for="study-email" class="mono">The monthly study, by email</label>'
            '<div class="study-row"><input id="study-email" name="email" type="email" autocomplete="email" required '
            'placeholder="name@family-office.in"><button class="btn btn-solid" type="submit">Send it to me →</button></div>'
            '<p class="small" data-status role="status">One study a month. No offers, no pitches. Leave whenever you like.</p></form>')


def c_services():
    cells = "".join(f'<a class="card" href="/services/{s}/"><h3>{n}</h3><p>{d}</p><span class="arrow">Read →</span></a>'
                    for s, n, d in SERVICES)
    return f'<div class="cells c3 rv">{cells}</div>'


def c_regionlist():
    cells = "".join(f'<a class="card" href="/regions/{s}/"><span class="mono">{i:02d}</span><h3>{n}</h3><span class="arrow">Read →</span></a>'
                    for i, (s, n) in enumerate(REGIONS, 1))
    return f'<div class="cells c3 rv">{cells}</div>'


def c_atlas():
    items = "".join(f'<li><a href="/developers/{s}/">{n} and land in North India</a><span class="small">An independent landowner\'s read</span></li>'
                    for s, n in DEVS)
    return f'<ul class="index rv" role="list">{items}</ul>'


def c_engage():
    return ('<div class="eng" data-engage>'
            '<div class="eng-bar" aria-hidden="true"><span></span></div>'
            '<p class="mono eng-count" aria-live="polite">Six questions</p>'
            '<div class="eng-stage"><p>Six short questions, one at a time. Your answers stay in your browser unless you choose to send them.</p>'
            '<button class="btn btn-solid" type="button" data-start>Begin →</button></div>'
            '<noscript><p>These questions need JavaScript. You can write to us directly instead: '
            f'<a href="{wa("Hello Advait. I would like to speak about land.")}">WhatsApp</a> or <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></noscript>'
            '</div>')


COMPONENTS = {"fees": c_fees, "regions": c_regions, "principal": c_principal, "study": c_study,
              "services": c_services, "regionlist": c_regionlist, "atlas": c_atlas, "engage": c_engage}


# ---------- body markup ----------

def render(body, page):
    out, para = [], []
    state = {"open": False, "km": 0}
    lines = body.split("\n")
    i = 0

    def flush():
        if para:
            out.append(f'<p class="rv">{inline(" ".join(para), page)}</p>')
            para.clear()

    def block(prefix_test):
        nonlocal i
        got = []
        while i < len(lines) and prefix_test(lines[i]):
            got.append(lines[i].rstrip())
            i += 1
        return got

    def until_end():
        nonlocal i
        got = []
        while i < len(lines) and lines[i].strip() != "!end":
            got.append(lines[i].rstrip())
            i += 1
        i += 1
        return [g for g in got if g.strip()]

    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            flush(); i += 1; continue
        if ln.startswith("## "):
            flush()
            if state["open"]:
                out.append("</div></section>")
            m = re.match(r"## (.+?)(?:\s*\{(.+)\})?$", ln)
            title, marker = m.group(1), m.group(2)
            if marker and marker.startswith("KM "):
                km = marker
            else:
                state["km"] += 18
                km = f"KM {state['km']:03d} · {marker or title}"
            sid = slug(title)
            cls = "sec"
            if "[circle]" in title:
                title = title.replace("[circle]", "").strip(); cls += " sec-circle"
            out.append(f'<section class="{cls}" id="{slug(title)}"><div class="wrap">'
                       f'<p class="km rv">{html.escape(km)}</p><h2 class="rv">{inline(title, page)}</h2>')
            state["open"] = True
            i += 1; continue
        if ln.startswith("### "):
            flush()
            t = ln[4:]
            out.append(f'<h3 class="rv" id="{slug(t)}">{inline(t, page)}</h3>')
            i += 1; continue
        if ln.startswith("- "):
            flush()
            items = block(lambda l: l.startswith("- "))
            out.append('<ul class="rv">' + "".join(f"<li>{inline(x[2:], page)}</li>" for x in items) + "</ul>")
            continue
        if re.match(r"\d+\. ", ln):
            flush()
            items = block(lambda l: bool(re.match(r"\d+\. ", l)))
            out.append('<ol class="rv">' + "".join(f"<li>{inline(re.sub(r'^\d+\. ', '', x), page)}</li>" for x in items) + "</ol>")
            continue
        if ln.startswith("> "):
            flush()
            items = block(lambda l: l.startswith("> "))
            out.append('<blockquote class="pull rv"><p>' + inline(" ".join(x[2:] for x in items), page) + "</p></blockquote>")
            continue
        if ln.startswith("|"):
            flush()
            rows = [r for r in block(lambda l: l.startswith("|")) if not re.match(r"^\|[\s:|-]+\|$", r)]
            cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
            head = "".join(f'<th scope="col">{inline(c, page)}</th>' for c in cells[0])
            body_rows = "".join("<tr>" + "".join(
                (f'<th scope="row">{inline(c, page)}</th>' if j == 0 else f"<td>{inline(c, page)}</td>")
                for j, c in enumerate(r)) + "</tr>" for r in cells[1:])
            out.append(f'<div class="tbl rv"><table><thead><tr>{head}</tr></thead><tbody>{body_rows}</tbody></table></div>')
            continue
        if ln.startswith("<"):
            flush()
            out.append("\n".join(block(lambda l: l.strip() != "")))
            continue
        if ln.startswith("!"):
            flush()
            m = re.match(r"!(/?[\w]+)\s*(.*)$", ln)
            name, arg = m.group(1), m.group(2).strip()
            i += 1
            if name == "div":
                out.append(f'<div class="{arg} rv">')
            elif name == "/div":
                out.append("</div>")
            elif name == "cells":
                items = until_end()
                out.append(f'<div class="cells c{arg or 3} rv">' + "".join(
                    f'<p class="cell">{inline(x[2:], page)}</p>' for x in items) + "</div>")
            elif name == "cards":
                items = until_end()
                html_items = []
                for x in items:
                    parts = [p.strip() for p in x[2:].split("::")]
                    t, d = parts[0], parts[1]
                    flag = parts[2] if len(parts) > 2 else ""
                    sub = parts[3] if len(parts) > 3 else ""
                    hl = " hl" if "hl" in flag.split() else ""
                    url = next((f for f in flag.split() if f.startswith("/")), "")
                    tag = "a" if url else "div"
                    href = f' href="{url}"' if url else ""
                    subp = f'<p class="mono">{inline(sub, page)}</p>' if sub else ""
                    more = '<span class="arrow">Read →</span>' if url else ""
                    html_items.append(f'<{tag} class="card{hl}"{href}>{subp}<h3>{inline(t, page)}</h3><p>{inline(d, page)}</p>{more}</{tag}>')
                out.append(f'<div class="cells c{arg or 3} rv">' + "".join(html_items) + "</div>")
            elif name == "steps":
                items = until_end()
                lis = "".join(f'<li><div><h3>{inline(x[2:].split("::")[0].strip(), page)}</h3><p>{inline(x[2:].split("::")[1].strip(), page)}</p></div></li>' for x in items)
                out.append(f'<ol class="steps rv">{lis}</ol>')
            elif name == "faq":
                items = until_end()
                qa, cur = [], None
                for x in items:
                    if x.startswith("? "):
                        cur = [x[2:], []]; qa.append(cur)
                    else:
                        cur[1].append(x)
                FAQS[page] = [(q, " ".join(a)) for q, a in qa]
                out.append('<div class="faq rv">' + "".join(
                    f'<details><summary>{inline(q, page)}</summary><p>{inline(" ".join(a), page)}</p></details>' for q, a in qa) + "</div>")
            elif name == "links":
                items = until_end()
                lis = []
                for x in items:
                    p = [s.strip() for s in x[2:].split("::")]
                    d = f'<span class="small">{inline(p[2], page)}</span>' if len(p) > 2 else ""
                    lis.append(f'<li><a href="{p[1]}">{inline(p[0], page)}</a>{d}</li>')
                out.append(f'<ul class="index rv" role="list">{"".join(lis)}</ul>')
            elif name == "box":
                items = until_end()
                out.append(f'<aside class="box rv"><p class="mono">{inline(arg, page)}</p>' + "".join(f"<p>{inline(x, page)}</p>" for x in items) + "</aside>")
            elif name == "note":
                out.append(f'<p class="note rv">{inline(arg, page)}</p>')
            elif name == "cta":
                line = f'<p class="cta-line">{inline(arg, page)}</p>' if arg else ""
                out.append(f'<div class="cta-block rv">{line}<div class="btns">{btns()}</div></div>')
            elif name == "close":
                out.append(f'<div class="cta-block rv"><p class="cta-line">{CLOSE_LINE}</p><div class="btns">{btns()}</div></div>')
            elif name in COMPONENTS:
                out.append(COMPONENTS[name]())
            else:
                sys.exit(f"{page}: unknown directive !{name}")
            continue
        para.append(ln.strip())
        i += 1
    flush()
    if state["open"]:
        out.append("</div></section>")
    return "\n".join(out)


# ---------- page shell ----------

def nav(path):
    items = [("Approach", "/approach/"), ("Services", "/services/"), ("Regions", "/regions/"),
             ("Thinking", "/notes/"), ("Circle", "/circle/")]
    lis = "".join(
        f'<li><a href="{u}"{" aria-current=\"page\"" if path.startswith(u) else ""}>{n}</a></li>' for n, u in items)
    return (
        '<a class="skip" href="#main">Skip to content</a>'
        '<header class="nav"><div class="wrap nav-in">'
        '<a class="brand" href="/" aria-label="Advait, home">Advait</a>'
        f'<nav class="nav-menu" id="menu" aria-label="Primary"><ul role="list">{lis}'
        '<li class="menu-cta"><a href="/engage/">Before we speak →</a></li></ul></nav>'
        '<span class="clock mono" data-clock>New Delhi · IST</span>'
        '<a class="btn btn-solid btn-sm nav-cta" href="/engage/">Before we speak</a>'
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>'
        "</div></header>")


def footer():
    svc = "".join(f'<li><a href="/services/{s}/">{n}</a></li>' for s, n, _ in SERVICES)
    reg = "".join(f'<li><a href="/regions/{s}/">{n}</a></li>' for s, n in REGIONS)
    practice = [("Approach", "/approach/"), ("The Circle", "/circle/"), ("Developer Atlas", "/developers/"),
                ("Corridor Desk", "/desk/"), ("Notes", "/notes/"), ("Before we speak", "/engage/"),
                ("Privacy", "/privacy/"), ("Disclaimer", "/disclaimer/")]
    pr = "".join(f'<li><a href="{u}">{n}</a></li>' for n, u in practice)
    t = "Hello Advait. I would like to speak about land."
    return (
        '<footer class="foot"><div class="wrap">'
        f'<p class="foot-line">{FOOT_LINE}</p>'
        f'<div class="btns">{btns()}<a class="btn btn-line" href="mailto:{EMAIL}">{EMAIL}</a></div>'
        '<div class="foot-cols">'
        f'<div><p class="mono">Services</p><ul role="list"><li><a href="/services/">All services</a></li>{svc}</ul></div>'
        f'<div><p class="mono">Regions</p><ul role="list"><li><a href="/regions/">All regions</a></li>{reg}</ul></div>'
        f'<div><p class="mono">Practice</p><ul role="list">{pr}</ul></div>'
        "</div>"
        f'<p class="legal">{LEGAL}</p>'
        '<div class="foot-base"><p class="small">© 2026 Advait Consultancy · Arjun Dixit, Principal · New Delhi · By appointment · Paid only by the client</p>'
        '<button class="theme-btn" type="button" data-theme-toggle aria-pressed="false">Dark paper</button></div>'
        "</div></footer>"
        '<div class="dock"><a class="btn btn-solid" href="/engage/">Before we speak</a>'
        f'<a class="btn btn-line" href="{wa(t)}" data-wa="{t}">WhatsApp</a></div>')


ORG_ID = SITE + "/#org"


def org():
    return {
        "@type": "ProfessionalService", "@id": ORG_ID, "name": "Advait", "legalName": "Advait Consultancy",
        "alternateName": "Advait Consultancy, New Delhi", "url": SITE + "/", "email": EMAIL,
        "telephone": "+91-96506-50178", "image": OG, "logo": SITE + "/favicon.svg",
        "description": "A private land value-design practice in New Delhi. Advisory and research on land across North India, paid only by the client.",
        "slogan": "Great assets are built, not bought.",
        "founder": {"@type": "Person", "name": "Arjun Dixit", "jobTitle": "Principal"},
        "address": {"@type": "PostalAddress", "addressLocality": "New Delhi", "addressRegion": "Delhi", "addressCountry": "IN"},
        "areaServed": [{"@type": "Place", "name": n} for n, _ in STRIP],
        "knowsAbout": ["Land advisory", "Joint development agreements", "Change of land use in Haryana",
                       "Section 80 UP Revenue Code 2006", "Section 118 HP Tenancy and Land Reforms Act",
                       "Agri-tourism and farm stays", "Family land stewardship", "NRI land counsel"],
    }


def crumbs_ld(page, crumbs):
    items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}]
    for n, (name, url) in enumerate(crumbs, 2):
        items.append({"@type": "ListItem", "position": n, "name": name, "item": SITE + url})
    return {"@type": "BreadcrumbList", "itemListElement": items}


def jsonld(p):
    url = SITE + p["path"]
    crumbs = p["crumbs"] + [(p.get("crumb", p["h1_plain"]), p["path"])]
    kind = p["kind"]
    graph = []
    if kind == "home":
        graph += [org(), {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "Advait",
                          "inLanguage": "en-IN", "publisher": {"@id": ORG_ID}}]
    elif kind == "service":
        graph += [{"@type": "Service", "name": p["h1_plain"], "serviceType": p.get("crumb", p["h1_plain"]),
                   "url": url, "description": p["desc"], "provider": {"@id": ORG_ID},
                   "areaServed": [{"@type": "Place", "name": n} for n, _ in STRIP]},
                  crumbs_ld(p, crumbs)]
    elif kind == "atlas":
        graph += [{"@type": "Article", "headline": p["h1_plain"], "description": p["desc"], "url": url,
                   "mainEntityOfPage": url, "datePublished": TODAY, "dateModified": TODAY, "inLanguage": "en-IN",
                   "author": {"@type": "Person", "name": "Arjun Dixit"}, "publisher": {"@id": ORG_ID}, "image": OG},
                  crumbs_ld(p, crumbs)]
    else:
        graph += [{"@type": "WebPage", "name": p["title"], "url": url, "description": p["desc"],
                   "inLanguage": "en-IN", "isPartOf": {"@id": SITE + "/#site"}, "dateModified": TODAY}]
        if p["crumbs"] or kind != "page" or p["path"] != "/":
            graph.append(crumbs_ld(p, crumbs))
    if kind != "home":
        graph.append(dict(org(), **{"@type": "ProfessionalService"}))
    if p["path"] in FAQS:
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", a).replace("*", "")}}
            for q, a in FAQS[p["path"]]]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))


def asset_v(name):
    return hashlib.sha1((ROOT / "assets" / name).read_bytes()).hexdigest()[:8]


def page_html(p, main):
    url = SITE + p["path"]
    robots = "noindex, follow" if p["kind"] == "404" else "index, follow, max-image-preview:large"
    canon = "" if p["kind"] == "404" else f'<link rel="canonical" href="{url}">'
    og_type = "article" if p["kind"] == "atlas" else "website"
    t, d = html.escape(p["title"]), html.escape(p["desc"])
    fonts = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Inter:wght@400;500&family=JetBrains+Mono&display=swap"
    return f"""<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
{canon}
<meta name="robots" content="{robots}">
<meta name="author" content="Advait Consultancy">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Advait">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Advait. Great assets are built, not bought.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{OG}">
<meta name="theme-color" content="#F4EFE6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15140F" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="{fonts}"></noscript>
<link rel="stylesheet" href="/assets/site.css?v={asset_v('site.css')}">
<script>(function(d){{d.classList.add("js");setTimeout(function(){{if(!window.ADVAIT)d.classList.remove("js")}},2500);try{{var t=localStorage.getItem("advait-theme");if(t)d.setAttribute("data-theme",t)}}catch(e){{}}}})(document.documentElement)</script>
<script type="application/ld+json">{jsonld(p)}</script>
<script src="/assets/site.js?v={asset_v('site.js')}" defer></script>
</head>
<body class="k-{p['kind']}">
{nav(p['path'])}
<main id="main">
{main}
</main>
{footer()}
</body>
</html>
"""


def hero(p):
    crumb = ""
    if p["crumbs"]:
        trail = ['<a href="/">Home</a>'] + [f'<a href="{u}">{n}</a>' for n, u in p["crumbs"]]
        crumb = f'<nav class="crumbs mono" aria-label="Breadcrumb">{" / ".join(trail)}</nav>'
    ctas = ""
    if p.get("ctas"):
        parts = []
        for c in p["ctas"].split(" ; "):
            label, url, style = [x.strip() for x in c.split("|")]
            parts.append(f'<a class="btn btn-{style}" href="{url}">{label}</a>')
        ctas = f'<div class="btns rv">{" ".join(parts)}</div>'
    meta = f'<p class="hero-meta mono rv">{html.escape(p["meta"])}</p>' if p.get("meta") else ""
    lede = "".join(f'<p class="lede rv">{inline(x, p["path"])}</p>' for x in p.get("lede", "").split(" // ") if x)
    cls = "hero" if p["kind"] == "home" else "hero hero-in"
    return (f'<section class="{cls}"><div class="wrap">{crumb}'
            f'<p class="km rv">KM 000 · {html.escape(p["marker"])}</p>'
            f'<h1 class="rv">{inline(p["h1"], p["path"])}</h1>{lede}{ctas}{meta}</div></section>')


def load(fp):
    raw = fp.read_text(encoding="utf-8")
    head, body = raw.split("\n---\n", 1)
    p = {}
    for ln in head.strip().split("\n"):
        k, v = ln.split(":", 1)
        p[k.strip()] = v.strip()
    p.setdefault("kind", "page")
    p["crumbs"] = [tuple(x.split("|")) for x in p["crumbs"].split(" ; ")] if p.get("crumbs") else []
    p["h1_plain"] = re.sub(r"[*]", "", p["h1"])
    p["body"] = body
    return p


def out_path(path):
    if path.endswith(".html"):
        return ROOT / path.lstrip("/")
    return ROOT / path.lstrip("/") / "index.html"


def contours():
    """The hero motif: a few hand-irregular contour rings, like a survey sheet."""
    paths = []
    for hill, (cx, cy, base, n, ph) in enumerate([(540, 500, 40, 12, 0.4)]):
        for k in range(n):
            r0 = base + k * 38
            pts = []
            for s in range(0, 73):
                a = s / 72 * 2 * math.pi
                r = r0 * (1 + 0.085 * math.sin(3 * a + ph + k * 0.21) + 0.05 * math.sin(5 * a + 1.3 + k * 0.17)
                          + 0.03 * math.sin(2 * a + 2.0 - k * 0.12))
                pts.append((cx + k * 4 + r * math.cos(a), cy - k * 3 + r * 0.82 * math.sin(a)))
            d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"
            paths.append(f'<path d="{d}"/>')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none" stroke="#000" '
           'stroke-width="1.3" stroke-linejoin="round">' + "".join(paths) + "</svg>")
    (ROOT / "assets" / "contours.svg").write_text(svg)


def visible_text(doc):
    doc = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", " ", doc, flags=re.S)
    doc = re.sub(r"<[^>]+>", " ", doc)
    return html.unescape(doc)


def words(doc):
    m = re.search(r"<main[^>]*>(.*)</main>", doc, re.S)
    return len(re.findall(r"[\w₹’'%–-]+", visible_text(m.group(1))))


def main():
    contours()
    pages = [load(fp) for fp in sorted(CONTENT.glob("*.txt"))]
    built = {}
    for p in pages:
        body = render(p["body"], p["path"])
        main_html = hero(p) + "\n" + body
        doc = page_html(p, main_html)
        fp = out_path(p["path"])
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_text(doc, encoding="utf-8")
        built[p["path"]] = (p, doc)

    # sitemap: every built page plus the existing notes and desk
    urls = [path for path, (p, _) in built.items() if p["kind"] != "404"]
    for fp in sorted(list((ROOT / "notes").rglob("index.html")) + [ROOT / "desk" / "index.html"]):
        urls.append("/" + str(fp.parent.relative_to(ROOT)) + "/")
    order = lambda u: (u != "/", u.count("/"), u)
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in sorted(set(urls), key=order):
        pr = "1.0" if u == "/" else ("0.8" if u.count("/") <= 2 else "0.6")
        sm.append(f"  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")

    qa(built, urls)


def qa(built, urls):
    problems, report = [], []
    titles, descs, h1s = {}, {}, {}
    ban_re = re.compile(r"(?<![\w-])(" + "|".join(re.escape(b) for b in BANNED) + r")(?![\w-])", re.I)
    tell_re = re.compile(r"\b(" + "|".join(re.escape(b) for b in TELLS) + r")\b", re.I)
    for path, (p, doc) in built.items():
        if len(p["title"]) > 60: problems.append(f"{path}: title {len(p['title'])} chars")
        if len(p["desc"]) > 155: problems.append(f"{path}: description {len(p['desc'])} chars")
        for store, key in ((titles, "title"), (descs, "desc"), (h1s, "h1_plain")):
            if p[key] in store: problems.append(f"{path}: duplicate {key} with {store[p[key]]}")
            store[p[key]] = path
        if doc.count("<h1") != 1: problems.append(f"{path}: {doc.count('<h1')} h1 tags")
        text = visible_text(doc)
        scan = re.sub(r"best answer", "", text, flags=re.I)
        scan = re.sub(r"[Ww]orking landscapes?", "", scan)
        for m in ban_re.finditer(scan):
            problems.append(f"{path}: banned word '{m.group(1)}' …{scan[max(0, m.start()-40):m.end()+30].strip()!r}")
        for m in tell_re.finditer(scan):
            problems.append(f"{path}: stock word '{m.group(1)}'")
        if p["kind"] != "404" and "we should speak" not in text:
            problems.append(f"{path}: problem-first footer line missing")
        if "Jewar" in p["h1_plain"] and path != "/regions/yamuna-expressway/":
            problems.append(f"{path}: Jewar in H1")
        if path == "/" and re.search(r"Jewar", doc.split("</head>")[0] + text[:2500]):
            problems.append("/: Jewar in homepage meta or hero")
        for href in re.findall(r'href="(/[^"]*)"', doc):
            target = href.split("#")[0].split("?")[0]
            if not target or target.startswith("//"):
                continue
            f = ROOT / target.lstrip("/")
            if not (f.is_file() or (f / "index.html").is_file()):
                problems.append(f"{path}: broken link {href}")
        w = words(doc)
        report.append((path, p["kind"], w, p.get("primary", "")))
        ranges = {"service": (900, 1400), "region": (900, 1300), "atlas": (1000, 1600)}
        if p["kind"] in ranges:
            lo, hi = ranges[p["kind"]]
            if not lo <= w <= hi:
                problems.append(f"{path}: {w} words, target {lo}-{hi}")
    js = (ROOT / "assets" / "site.js").read_text()
    js_copy = js.split("};", 1)[1]  # everything after the CONFIG block
    for m in ban_re.finditer(re.sub(r"best answer", "", js_copy)):
        problems.append(f"site.js copy: banned word '{m.group(1)}'")
    size = sum((ROOT / "assets" / f).stat().st_size for f in ("site.css", "site.js"))

    lines = ["# Build report", "", f"Generated {TODAY} by `_src/build.py`.", "",
             f"CSS + JS combined: {size/1024:.1f} KB (budget 60 KB).", "",
             "| Page | Type | Words in main | Primary keyword |", "|---|---|---:|---|"]
    lines += [f"| `{a}` | {b} | {c} | {d} |" for a, b, c, d in sorted(report)]
    lines += ["", "## TODO-VERIFY", "",
              "Each fact below is published with its source and date, and carries a `<!-- TODO-VERIFY -->` marker in the page source. Check it against the primary source, then delete the marker in `_src/content`.", ""]
    cur = None
    for path, note in TV:
        if path != cur:
            lines += ["", f"### `{path}`"]; cur = path
        lines.append(f"- {note}")
    lines += ["", "## Open items", "",
              "- CONFIG in `/assets/site.js`: set BOOKING_URL, PAYMENT_URL and WEB3FORMS_KEY. Until then every form and booking button falls back to WhatsApp.",
              "- Portrait of the Principal: the slot is on the home page (`.portrait`).",
              "- Search Console and Bing: prefer DNS verification for the domain property; CONFIG verification is injected by script.",
              "- Developer Atlas: next wave of five per brief section 8, after checking each developer is active and solvent.",
              "- Keyword volumes: validate in Keyword Planner and Search Console before final assignment."]
    (ROOT / "_src" / "REPORT.md").write_text("\n".join(lines) + "\n")

    print(f"Built {len(built)} pages, sitemap {len(set(urls))} URLs, CSS+JS {size/1024:.1f} KB, TODO-VERIFY {len(TV)}")
    for path, kind, w, kw in sorted(report):
        print(f"  {w:5d}  {kind:8s} {path}")
    if problems:
        print("\nQA PROBLEMS:")
        for pr in problems:
            print("  -", pr)
    else:
        print("\nQA: clean")


if __name__ == "__main__":
    main()
