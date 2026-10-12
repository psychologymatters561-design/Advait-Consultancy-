/* Advait — site.js. CONFIG is the only block meant to be edited.
   Any value still containing YOUR- is treated as unset; every unset value falls back to WhatsApp. */
const CONFIG = {
  WHATSAPP: "919650650178",
  BOOKING_URL: "https://cal.com/YOUR-HANDLE/ground-session",
  PAYMENT_URL: "https://pages.razorpay.com/YOUR-PAGE",
  WEB3FORMS_KEY: "YOUR-WEB3FORMS-ACCESS-KEY",
  GOOGLE_VERIFY: "", BING_VERIFY: ""
};

(function () {
  "use strict";
  window.ADVAIT = true;
  var d = document, root = d.documentElement;
  var isSet = function (v) { return !!v && v.indexOf("YOUR-") === -1; };
  var wa = function (t) { return "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(t); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* search engine verification, only when set in CONFIG */
  [["google-site-verification", CONFIG.GOOGLE_VERIFY], ["msvalidate.01", CONFIG.BING_VERIFY]].forEach(function (p) {
    if (p[1]) { var m = d.createElement("meta"); m.name = p[0]; m.content = p[1]; d.head.appendChild(m); }
  });

  /* WhatsApp links follow CONFIG */
  $$("[data-wa]").forEach(function (a) { a.href = wa(a.getAttribute("data-wa")); });

  /* New Delhi clock */
  var clocks = $$("[data-clock]");
  if (clocks.length && window.Intl) {
    var fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    var tick = function () {
      var t = "New Delhi " + fmt.format(new Date()) + " IST";
      clocks.forEach(function (c) { if (c.textContent !== t) c.textContent = t; });
    };
    tick(); setInterval(tick, 15000);
  }

  /* theme */
  var mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var effective = function () { return root.getAttribute("data-theme") || (mq.matches ? "dark" : "light"); };
  var toggles = $$("[data-theme-toggle]");
  var label = function () {
    var dark = effective() === "dark";
    toggles.forEach(function (b) { b.textContent = dark ? "Light paper" : "Dark paper"; b.setAttribute("aria-pressed", String(dark)); });
  };
  toggles.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = effective() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next); store.set("advait-theme", next); label();
    });
  });
  label();

  /* mobile menu */
  var nav = $(".nav"), menuBtn = $(".menu-btn");
  if (nav && menuBtn) {
    var setMenu = function (open) { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.textContent = open ? "Close" : "Menu"; };
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });
  }

  /* fade-up reveal */
  var reveal = $$(".rv");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    reveal.forEach(function (e) { e.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveal.forEach(function (e) { io.observe(e); });
  }

  /* Web3Forms; resolves false when the key is unset or the request fails */
  function send(data) {
    if (!isSet(CONFIG.WEB3FORMS_KEY)) return Promise.resolve(false);
    data.access_key = CONFIG.WEB3FORMS_KEY;
    return fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (j) { return !!j.success; }).catch(function () { return false; });
  }
  function waFallback(statusEl, text) {
    var href = wa(text);
    statusEl.innerHTML = 'To finish, send it on WhatsApp: <a href="' + href + '" rel="noopener">open the prefilled message →</a>';
    return href;
  }

  /* monthly study */
  $$("form[data-study]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = f.email.value.trim(), st = $("[data-status]", f);
      var msg = "Please add me to Advait's monthly study: " + email;
      if (!isSet(CONFIG.WEB3FORMS_KEY)) { window.open(waFallback(st, msg), "_blank", "noopener"); return; }
      st.textContent = "Sending…";
      send({ subject: "Monthly study: new reader", from_name: "advaitconsultancy.in", email: email }).then(function (ok) {
        if (ok) { st.textContent = "Noted. The next study will reach you."; f.reset(); } else { waFallback(st, msg); }
      });
    });
  });

  /* Before we speak: six questions */
  var E = $("[data-engage]");
  if (!E) return;
  var Q = [
    ["How long can this capital rest in land?", [["Under three years", "x"], ["Three to five years", 1], ["Five to ten years", 2], ["Longer", 2]]],
    ["Roughly what are you considering placing?", [["Under ₹50 lakh", "x"], ["₹50 lakh – ₹2 crore", 1], ["₹2 – 10 crore", 2], ["Above ₹10 crore", 2], ["We hold land; we need a plan, not capital", 2]]],
    ["What role would you like?", [["Tell me what to buy", 0], ["Build with partners and be part of it", 2], ["Own it; let specialists run it", 2]]],
    ["Might this money need to come back within two years?", [["Quite possibly", "x"], ["Some of it, perhaps", 1], ["No, it is patient", 2]]],
    ["What should the land become?", [["Whatever appreciates fastest", 1], ["Something that earns while it appreciates", 2], ["A place people travel to, held for the family", 2]]],
    ["If the land fails our read, do you want to hear it?", [["Yes — that is why one takes counsel", 2], ["I'd rather move quickly", "x"]]]
  ];
  var stage = $(".eng-stage", E), bar = $(".eng-bar span", E), count = $(".eng-count", E);
  var step = 0, ans = [];

  function summary() {
    return Q.map(function (q, k) { return (k + 1) + ". " + q[0] + " " + q[1][ans[k]][0]; }).join("\n");
  }
  function focusHead() { var h = $("h2", stage); if (h) h.focus(); }

  function ask() {
    var q = Q[step];
    bar.style.width = (step / Q.length * 100) + "%";
    count.textContent = "Question " + (step + 1) + " of " + Q.length;
    stage.innerHTML = '<h2 class="eng-q" tabindex="-1">' + esc(q[0]) + "</h2>" +
      '<div class="eng-opts" role="group" aria-label="' + esc(q[0]) + '">' +
      q[1].map(function (o, i) { return '<button type="button" class="opt" data-i="' + i + '" aria-pressed="' + (ans[step] === i) + '">' + esc(o[0]) + "</button>"; }).join("") +
      "</div>" + (step > 0 ? '<button type="button" class="linkbtn" data-back>← Back</button>' : "");
    focusHead();
  }

  function outcome() {
    var vals = ans.map(function (a, k) { return Q[k][1][a][1]; });
    var hard = vals.indexOf("x") !== -1;
    var score = hard ? 0 : vals.reduce(function (s, v) { return s + v; }, 0);
    var kind = hard ? "not" : (score >= 10 ? "fit" : "notyet");
    store.set("advait-engage", JSON.stringify({ outcome: kind, score: score, at: new Date().toISOString() }));
    bar.style.width = "100%";
    count.textContent = "Six of six";
    var again = '<p><button type="button" class="linkbtn" data-restart>Answer again</button></p>';
    if (kind === "not") {
      stage.innerHTML = '<h2 class="eng-q" tabindex="-1">Not our mandate</h2>' +
        "<p>From your answers, what you need is shorter, more liquid or faster than the way we work. Early exits from land do happen; we simply don't design for them. Our research is open to you — no follow-up, no pitch.</p>" +
        '<div class="btns"><a class="btn btn-line" href="/notes/">Read the Notes</a><a class="btn btn-line" href="/desk/">Open the Corridor Desk</a></div>' + again;
    } else if (kind === "notyet") {
      stage.innerHTML = '<h2 class="eng-q" tabindex="-1">Not yet</h2>' +
        "<p>Your answers sit between the way we work and the way you would like to. That is a fair place to be. Read the Notes for a while; if your view changes, write one line on WhatsApp.</p>" +
        '<div class="btns"><a class="btn btn-line" href="/notes/">Read the Notes</a><a class="btn btn-line" href="' + wa("Hello Advait. My view has changed since I answered the six questions.") + '" rel="noopener">Write one line on WhatsApp</a></div>' + again;
    } else {
      var book = isSet(CONFIG.BOOKING_URL) ? CONFIG.BOOKING_URL : wa("Hello Advait. I would like a Ground Session (₹15,000, credited against any mandate).\n\nMy answers:\n" + summary());
      var pay = isSet(CONFIG.PAYMENT_URL) ? '<a class="btn btn-line" href="' + esc(CONFIG.PAYMENT_URL) + '" rel="noopener">Settle the session fee</a>' : "";
      stage.innerHTML = '<h2 class="eng-q" tabindex="-1">Likely fit</h2>' +
        "<p>The next step is a Ground Session: 60 to 75 minutes on your land, at your premises or by video. The fee is ₹15,000, credited in full against any mandate. Send a short brief first, or go straight to a time.</p>" +
        '<form data-brief novalidate>' +
        '<label class="mono" for="b-name">Name</label><input id="b-name" name="name" autocomplete="name" required>' +
        '<label class="mono" for="b-wa">WhatsApp number</label><input id="b-wa" name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" required>' +
        '<label class="mono" for="b-email">Email</label><input id="b-email" name="email" type="email" autocomplete="email" required>' +
        '<label class="mono" for="b-line">One line on what, and where</label><input id="b-line" name="line" required placeholder="Eleven acres near Sohna; a developer has written to us.">' +
        '<div class="btns"><button class="btn btn-solid" type="submit">Send the brief →</button><a class="btn btn-line" href="' + esc(book) + '" rel="noopener">Book the session</a>' + pay + "</div>" +
        '<p class="small" data-status role="status">Your brief goes only to the Principal.</p></form>' + again;
      var f = $("form", stage);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var st = $("[data-status]", f);
        if (!f.checkValidity()) { st.textContent = "Please fill in all four fields."; var bad = $(":invalid", f); if (bad) bad.focus(); return; }
        var el = function (n) { return f.elements.namedItem(n).value.trim(); };
        var v = { name: el("name"), whatsapp: el("whatsapp"), email: el("email"), line: el("line") };
        var text = "Brief for Advait\nName: " + v.name + "\nWhatsApp: " + v.whatsapp + "\nEmail: " + v.email + "\nWhat and where: " + v.line + "\n\nSix questions (score " + score + "):\n" + summary();
        if (!isSet(CONFIG.WEB3FORMS_KEY)) { window.open(waFallback(st, text), "_blank", "noopener"); return; }
        st.textContent = "Sending…";
        send({ subject: "Brief: " + v.name, from_name: "advaitconsultancy.in", name: v.name, email: v.email, whatsapp: v.whatsapp, brief: v.line, score: score, answers: summary() })
          .then(function (ok) { if (ok) { st.textContent = "Received. The Principal will write to you within two working days."; f.reset(); } else { waFallback(st, text); } });
      });
    }
    focusHead();
  }

  E.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null;
    if (!t) return;
    if (t.hasAttribute("data-start") || t.hasAttribute("data-restart")) { step = 0; ans = []; ask(); }
    else if (t.hasAttribute("data-back")) { step = Math.max(0, step - 1); ask(); }
    else if (t.hasAttribute("data-i")) {
      ans[step] = Number(t.getAttribute("data-i"));
      ans.length = step + 1;
      step++;
      if (step < Q.length) ask(); else outcome();
    }
  });
})();
