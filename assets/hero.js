/* Advait — the arrival hero.
   Scroll scrubs the film. Its last light opens into the paper page, and the
   land's contour lines draw outward from the door.
   Desktop scrubs the video; phones, tablets, slow or data-saving connections
   move the first frame instead. Reduced motion keeps the still layout. */
(function () {
  "use strict";
  var root = document.querySelector("[data-cine]");
  if (!root) return;
  var w = window, d = document;
  var nav = d.querySelector(".nav");
  var reduce = w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    /* still layout: the nav is clear over the picture, solid once past it */
    var media = root.querySelector(".cine-media");
    var still = function () { if (nav) nav.classList.toggle("on-video", w.pageYOffset < media.offsetHeight - 90); };
    still(); w.addEventListener("scroll", still, { passive: true });
    return;
  }

  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var stage = $(".cine-stage"), zoom = $(".cine-zoom"), video = $(".cine-video");
  var glow = $(".cine-light i"), fill = $(".cine-light b");
  var ringSvg = $(".cine-rings"), rings = $$(".cine-rings path");
  var settle = $(".cine-settle"), settleItems = $$("[data-s]");
  var bands = $$("[data-band]").map(function (el) {
    return { el: el, r: el.getAttribute("data-band").split(",").map(Number) };
  });
  var shades = $$("[data-sh]"), shTop = $(".sh-t"), cue = $(".cine-cue");
  var loader = $(".cine-load"), loadText = loader && loader.querySelector("span"), loadArc = loader && loader.querySelector(".arc");

  /* the five gates: reduced motion (above), touch or small screens, slow
     networks, save-data, and a film that cannot play or fails to arrive */
  var conn = navigator.connection || {};
  var slow = !!conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || "");
  var desk = w.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)").matches;
  var can = function (t) { return !!(video && video.canPlayType && video.canPlayType(t)); };
  var ext = can('video/mp4; codecs="avc1.640028"') ? "mp4" : can('video/webm; codecs="vp9"') ? "webm" : "";
  var mode = desk && !slow && ext && w.fetch && w.Blob ? "video" : "image";
  root.classList.add("is-live", "is-" + mode);

  /* timeline: the walk ends at 0.86; the light opens 0.70 to 0.94; the page settles 0.88 on */
  var WALK = 0.86, FPS = 60, DROP = Math.min(76, w.innerHeight * 0.085);
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ramp = function (p, a, b) { return b <= a ? (p >= a ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); };
  var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var soft = function (x) { return 1 - Math.pow(1 - x, 3); };

  /* write to the DOM only when a value actually changes */
  function put(el, prop, val) {
    var c = el._v || (el._v = {});
    if (c[prop] === val) return;
    c[prop] = val;
    if (prop.charAt(0) === "-") el.style.setProperty(prop, val); else el.style[prop] = val;
  }
  var f3 = function (x) { return (Math.round(x * 1000) / 1000).toString(); };

  /* dark paper: the hall's light fades into the dark page instead of flaring */
  var dark = false, mqDark = w.matchMedia("(prefers-color-scheme: dark)");
  function theme() {
    var t = d.documentElement.getAttribute("data-theme");
    dark = t ? t === "dark" : mqDark.matches;
  }
  theme();
  if (mqDark.addEventListener) mqDark.addEventListener("change", function () { theme(); render(S, true); });
  if (w.MutationObserver) new MutationObserver(function () { theme(); render(S, true); })
    .observe(d.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* scroll geometry */
  var top = 0, len = 1;
  function measure() {
    var r = root.getBoundingClientRect();
    top = r.top + w.pageYOffset;
    len = Math.max(1, root.offsetHeight - stage.offsetHeight);
  }
  function target() { return clamp((w.pageYOffset - top) / len, 0, 1); }

  /* the film */
  var ready = false, shown = false, dur = 0, want = -1;
  function seekTo(t) {
    t = Math.round(t * FPS) / FPS;
    if (t === want) return;
    want = t;
    if (!video.seeking) video.currentTime = t;
  }
  if (video) video.addEventListener("seeked", function () {
    if (Math.abs(video.currentTime - want) > 0.5 / FPS) { video.currentTime = want; return; }
    if (!shown) { shown = true; root.classList.add("has-video"); if (loader) loader.hidden = true; }
  });

  function fail() {
    if (mode !== "video") return;
    mode = "image"; ready = false;
    root.classList.remove("is-video"); root.classList.add("is-image");
    if (loader) loader.hidden = true;
    measure(); kick();
  }

  function progress(f) {
    if (!loader) return;
    var pct = Math.round(f * 100);
    if (loadText && loadText.textContent !== "Film " + pct + "%") loadText.textContent = "Film " + pct + "%";
    if (loadArc) put(loadArc, "strokeDashoffset", String(100 - pct));
  }

  function load() {
    var dpr = w.devicePixelRatio || 1;
    var src = root.getAttribute("data-film") + (w.innerWidth * dpr >= 1500 ? "-1080." : "-720.") + ext;
    var ctrl = w.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); fail(); }, 30000);
    var shownLoader = setTimeout(function () { if (loader && !shown) loader.hidden = false; }, 600);
    fetch(src, { signal: ctrl && ctrl.signal, priority: "low" }).then(function (res) {
      if (!res.ok) throw new Error("film");
      var total = +res.headers.get("Content-Length") || 0;
      if (!res.body || !res.body.getReader || !total) return res.blob();
      var reader = res.body.getReader(), got = 0, chunks = [];
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(chunks, { type: "video/" + ext });
          chunks.push(r.value); got += r.value.length; progress(got / total);
          return pump();
        });
      })();
    }).then(function (blob) {
      clearTimeout(timer); clearTimeout(shownLoader);
      video.addEventListener("loadeddata", function () {
        dur = video.duration || 5.66;
        ready = true; want = -1;
        render(S, true);
      }, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.preload = "auto";
      video.src = URL.createObjectURL(blob);
      video.load();
    }).catch(function () { clearTimeout(timer); clearTimeout(shownLoader); fail(); });
  }

  /* one frame of the whole scene at smoothed progress p */
  function render(p, force) {
    var walk = ramp(p, 0, WALK);
    var push = ease(ramp(p, 0.70, 0.94));

    if (mode === "video" && ready) seekTo(walk * (dur - 1 / FPS));
    var scale = 1 + 0.16 * push + (mode === "image" ? 0.36 * ease(walk) : 0);
    var drop = (1 - ease(ramp(p, 0, 0.2))) * DROP;   /* the sign clears the nav, then the camera settles */
    var bright = dark ? 0 : ease(ramp(p, 0.68, 0.86)); /* eyes adjusting to the lit hall; on dark paper, a plain fade */
    put(zoom, "transform", "translate3d(0," + drop.toFixed(1) + "px,0) scale(" + f3(scale) + ")");
    put(zoom, "filter", bright > 0 ? "brightness(" + f3(1 + 0.55 * bright) + ") saturate(" + f3(1 - 0.35 * bright) + ")" : "none");

    for (var i = 0; i < bands.length; i++) {
      var b = bands[i], r = b.r;
      var a = r[0] === r[1] ? (p >= r[0] ? 1 : 0) : soft(ramp(p, r[0], r[1]));
      var o = 1 - ease(ramp(p, r[2], r[3]));
      var v = Math.min(a, o);
      var y = a < 1 ? (1 - a) * 28 : -(1 - o) * 22;
      put(b.el, "opacity", f3(v));
      put(b.el, "transform", "translate3d(0," + y.toFixed(1) + "px,0)");
      put(b.el, "visibility", v > 0.001 ? "visible" : "hidden");
      if (shades[i]) put(shades[i], "opacity", f3(v));
    }
    put(shTop, "opacity", f3(1 - ramp(p, 0.74, 0.84)));
    if (cue) put(cue, "opacity", f3(1 - ramp(p, 0, 0.035)));

    /* the light in the doorway opens until it is the page */
    put(glow, "opacity", f3(soft(ramp(p, 0.68, 0.82))));
    put(fill, "opacity", f3(ease(ramp(p, 0.77, 0.89))));

    /* contour lines draw outward from the door */
    put(ringSvg, "opacity", f3(ramp(p, 0.8, 0.88)));
    for (var k = 0; k < rings.length; k++) {
      var s0 = 0.81 + k * 0.011;
      put(rings[k], "strokeDashoffset", f3(1 - soft(ramp(p, s0, s0 + 0.09))));
    }

    /* the page arrives */
    for (var j = 0; j < settleItems.length; j++) {
      var q = soft(ramp(p, 0.855 + j * 0.02, 0.93 + j * 0.02));
      put(settleItems[j], "opacity", f3(q));
      put(settleItems[j], "transform", "translate3d(0," + ((1 - q) * 18).toFixed(1) + "px,0)");
    }
    var live = p > 0.84;
    put(settle, "visibility", live ? "visible" : "hidden");
    if (nav) nav.classList.toggle("on-video", p < 0.79);
  }

  /* a rAF loop that eases toward the scroll position and rests when it arrives */
  var S = 0, running = false, last = 0;
  function tick(now) {
    var dt = Math.min(64, now - last || 16.7); last = now;
    var P = target();
    S += (P - S) * (1 - Math.pow(1 - 0.11, dt / 16.667));
    if (Math.abs(P - S) < 0.0002) S = P;
    render(S);
    if (S !== P) requestAnimationFrame(tick); else running = false;
  }
  function kick() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(tick);
  }

  /* keyboard users who tab into the page's buttons are taken to where they are visible */
  settle.addEventListener("focusin", function () {
    if (S < 0.97) { w.scrollTo(0, top + len); S = 1; render(1); }
  });

  measure();
  S = target();
  render(S, true);
  w.addEventListener("scroll", kick, { passive: true });
  w.addEventListener("resize", function () { measure(); kick(); });
  if (w.ResizeObserver) new ResizeObserver(function () { measure(); kick(); }).observe(root);
  if (mode === "video") load();
})();
