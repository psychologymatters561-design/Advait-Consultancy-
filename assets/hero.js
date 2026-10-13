/* Advait — the arrival hero.
   Scroll plays the whole film, forwards and back. As it ends, the hall's light
   opens into the paper page and the land's contour lines draw outward.
   Desktop and landscape screens scrub the video; phones and portrait tablets
   draw a frame sequence on canvas, blending neighbouring frames so motion stays
   smooth. Data-saver connections get the still. Reduced motion keeps the still layout. */
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
  var stage = $(".cine-stage"), zoom = $(".cine-zoom"), video = $(".cine-video"), cv = $(".cine-canvas");
  var glow = $(".cine-light i"), fill = $(".cine-light b");
  var ringSvg = $(".cine-rings"), rings = $$(".cine-rings path");
  var settle = $(".cine-settle"), settleItems = $$("[data-s]");
  var bands = $$("[data-band]").map(function (el) {
    return { el: el, r: el.getAttribute("data-band").split(",").map(Number) };
  });
  var shades = $$("[data-sh]"), shTop = $(".sh-t"), cue = $(".cine-cue");
  var loader = $(".cine-load"), loadText = loader && loader.querySelector("span"), loadArc = loader && loader.querySelector(".arc");

  /* choose how the film plays on this device */
  var conn = navigator.connection || {};
  var saver = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  var can = function (t) { return !!(video && video.canPlayType && video.canPlayType(t)); };
  var ext = can('video/mp4; codecs="avc1.640028"') ? "mp4" : can('video/webm; codecs="vp9"') ? "webm" : "";
  var cx = cv && cv.getContext ? cv.getContext("2d", { alpha: false }) : null;
  var N = +root.getAttribute("data-frames") || 0;
  var tall = w.innerHeight > w.innerWidth * 0.9;
  var vid = ext && w.fetch && w.Blob;
  var mode = saver ? "image"
    : tall && cx && N ? "frames"
    : vid ? "video"
    : cx && N ? "frames"
    : "image";
  root.classList.add("is-live", "is-" + mode);

  /* timeline: the walk runs to 0.86; the light opens 0.68 to 0.89; the page settles from 0.855 */
  var WALK = 0.86, FPS = 60, DROP = Math.min(76, w.innerHeight * 0.085);
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ramp = function (p, a, b) { return b <= a ? (p >= a ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); };
  var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var soft = function (x) { return 1 - Math.pow(1 - x, 3); };

  /* write to the DOM only when a value actually changes */
  function put(el, prop, val) {
    if (!el) return;
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
  if (mqDark.addEventListener) mqDark.addEventListener("change", function () { theme(); render(S); });
  if (w.MutationObserver) new MutationObserver(function () { theme(); render(S); })
    .observe(d.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* scroll geometry */
  var top = 0, len = 1;
  function measure() {
    var r = root.getBoundingClientRect();
    top = r.top + w.pageYOffset;
    len = Math.max(1, root.offsetHeight - stage.offsetHeight);
  }
  function target() { return clamp((w.pageYOffset - top) / len, 0, 1); }

  /* honest loading ring */
  var loaderTimer = setTimeout(function () { if (loader && !shown) loader.hidden = false; }, 700);
  function progress(f) {
    if (!loader) return;
    var pct = Math.round(f * 100);
    if (loadText && loadText.textContent !== "Film " + pct + "%") loadText.textContent = "Film " + pct + "%";
    put(loadArc, "strokeDashoffset", String(100 - pct));
  }
  function doneLoading() { clearTimeout(loaderTimer); if (loader) loader.hidden = true; }

  /* ---- video: the whole file in memory as a Blob, seeks never overlap ---- */
  var ready = false, shown = false, dur = 0, want = -1;
  function seekTo(t) {
    t = Math.round(t * FPS) / FPS;
    if (t === want) return;
    want = t;
    if (!video.seeking) video.currentTime = t;
  }
  if (video) video.addEventListener("seeked", function () {
    if (!ready) return;
    if (Math.abs(video.currentTime - want) > 0.5 / FPS) { video.currentTime = want; return; }
    if (!shown) { shown = true; root.classList.add("has-video"); doneLoading(); }
  });

  function fallBack() {
    mode = "image"; ready = false;
    root.classList.remove("is-video", "is-frames"); root.classList.add("is-image");
    doneLoading(); measure(); kick();
  }

  function loadVideo() {
    var dpr = w.devicePixelRatio || 1;
    var src = root.getAttribute("data-film") + (w.innerWidth * dpr >= 1500 ? "-1080." : "-720.") + ext;
    fetch(src).then(function (res) {
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
      video.addEventListener("loadeddata", function () {
        dur = video.duration || 5.66;
        /* a muted play and pause wakes the decoder on Safari, so seeks paint */
        var go = function () { ready = true; want = -1; render(S); };
        var pr = video.play && video.play();
        if (pr && pr.then) pr.then(function () { video.pause(); go(); }, go); else go();
      }, { once: true });
      video.addEventListener("error", fallBack, { once: true });
      video.preload = "auto";
      video.src = URL.createObjectURL(blob);
      video.load();
    }).catch(fallBack);
  }

  /* ---- frames: a canvas sequence, loaded coarse to fine, neighbours blended ---- */
  var base = root.getAttribute("data-frames-src"), imgs = [], have = [], count = 0, lastKey = "";
  var pad = function (i) { return ("00" + (i + 1)).slice(-3); };
  function sizeCanvas() {
    if (!cv) return;
    var dpr = Math.min(2, w.devicePixelRatio || 1);
    var W = Math.round(stage.clientWidth * dpr), H = Math.round(stage.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; lastKey = ""; }
  }
  function paint(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight, cw = cv.width, ch = cv.height;
    var s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
    cx.drawImage(img, (cw - dw) / 2, (ch - dh) * 0.38, dw, dh);
  }
  function near(i, step) { for (var k = i; k >= 0 && k < N; k += step) if (have[k]) return k; return -1; }
  function drawFrames(pos) {
    var i = Math.floor(pos), f = pos - i;
    var a = have[i] ? i : near(i, -1);
    if (a < 0) a = near(i, 1);
    if (a < 0) return;
    var b = a === i && i + 1 < N && have[i + 1] ? i + 1 : -1;
    var q = b < 0 ? 0 : Math.round(f * 20) / 20;
    var key = a + ":" + b + ":" + q;
    if (key === lastKey) return;
    lastKey = key;
    cx.globalAlpha = 1; paint(imgs[a]);
    if (q > 0) { cx.globalAlpha = q; paint(imgs[b]); cx.globalAlpha = 1; }
  }
  function loadFrames() {
    sizeCanvas();
    var order = [], seen = {};
    [0, N - 1].concat([16, 8, 4, 2, 1].reduce(function (acc, s) {
      for (var i = 0; i < N; i += s) acc.push(i);
      return acc;
    }, [])).forEach(function (i) { if (!seen[i]) { seen[i] = 1; order.push(i); } });
    var next = 0, active = 0, failed = 0;
    function pump() {
      while (active < 6 && next < order.length) {
        (function (i) {
          var img = new Image();
          active++;
          img.decoding = "async";
          img.onload = function () {
            active--; imgs[i] = img; have[i] = true; count++;
            progress(count / N);
            if (!shown && have[0]) { shown = true; lastKey = ""; root.classList.add("has-frames"); render(S); }
            else if (shown) { lastKey = ""; drawFrames(ramp(S, 0, WALK) * (N - 1)); }
            if (count === N) doneLoading();
            pump();
          };
          img.onerror = function () { active--; if (++failed > 8 && !count) fallBack(); pump(); };
          img.src = base + pad(i) + ".webp";
        })(order[next++]);
      }
    }
    pump();
  }

  /* one frame of the whole scene at smoothed progress p */
  function render(p) {
    var walk = ramp(p, 0, WALK);
    var push = ease(ramp(p, 0.70, 0.94));

    if (mode === "video" && ready) seekTo(walk * (dur - 1 / FPS));
    else if (mode === "frames" && shown) drawFrames(walk * (N - 1));

    var scale = 1 + 0.16 * push + (mode === "image" ? 0.36 * ease(walk) : 0);
    var drop = (1 - ease(ramp(p, 0, 0.2))) * DROP;      /* the sign clears the nav, then the camera settles */
    var bright = dark ? 0 : ease(ramp(p, 0.68, 0.86));  /* eyes adjusting to the lit hall */
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
      put(shades[i], "opacity", f3(v));
    }
    put(shTop, "opacity", f3(1 - ramp(p, 0.74, 0.84)));
    put(cue, "opacity", f3(1 - ramp(p, 0, 0.035)));

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
    put(settle, "visibility", p > 0.84 ? "visible" : "hidden");
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

  function relayout() { measure(); if (mode === "frames") sizeCanvas(); render(S); kick(); }
  measure();
  S = target();
  render(S);
  w.addEventListener("scroll", kick, { passive: true });
  w.addEventListener("resize", relayout);
  if (w.ResizeObserver) new ResizeObserver(relayout).observe(root);
  if (mode === "video") loadVideo();
  else if (mode === "frames") loadFrames();
  else doneLoading();
})();
