(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // work/2cakes-studio/source/vendor/motion/motion.js
  var html = document.documentElement;
  var reducedQ = matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = () => reducedQ.matches;
  var shot = () => /HeadlessChrome/.test(navigator.userAgent) && html.dataset.motion !== "live";
  var jump = (el, on) => {
    el.classList.toggle("is-jump", on);
  };
  function nav() {
    const bar = document.querySelector(".nav");
    const links = bar == null ? void 0 : bar.querySelector(".nav__links");
    if (!links || bar.dataset.mNav) return;
    bar.dataset.mNav = "1";
    let t = 0;
    bar.querySelectorAll(".nav__item").forEach((item) => {
      const has = !!item.querySelector(".nav__menu");
      item.addEventListener("pointerenter", () => {
        clearTimeout(t);
        if (has) t = setTimeout(() => bar.classList.add("m-menu-open"), 150);
        else bar.classList.remove("m-menu-open");
      });
    });
    bar.addEventListener("pointerleave", () => {
      clearTimeout(t);
      bar.classList.remove("m-menu-open");
    });
  }
  function tabs() {
    document.querySelectorAll('.tabs[role="tablist"], [role="tablist"].m-tabs').forEach((list) => {
      var _a;
      if (!list.querySelector('[role="tab"]') || list.querySelector(":scope > .m-tab-ind")) return;
      const ind = document.createElement("span");
      ind.className = "m-tab-ind";
      ind.setAttribute("aria-hidden", "true");
      list.prepend(ind);
      list.classList.add("m-has-ind");
      let instant = true, at = null;
      const set = (b, sx = 1, sy = 1) => {
        ind.style.setProperty("--x", `${b.x}px`);
        ind.style.setProperty("--y", `${b.y}px`);
        ind.style.setProperty("--w", `${b.w}px`);
        ind.style.setProperty("--h", `${b.h}px`);
        ind.style.setProperty("--sx", String(sx));
        ind.style.setProperty("--sy", String(sy));
      };
      const place = () => {
        const sel = list.querySelector('[role="tab"][aria-selected="true"]');
        if (!sel) {
          ind.style.opacity = "0";
          return;
        }
        ind.style.opacity = "";
        const to = { x: sel.offsetLeft, y: sel.offsetTop, w: sel.offsetWidth, h: sel.offsetHeight };
        if (instant || reduced() || !at || !to.w || !to.h) {
          jump(ind, true);
          set(to);
          ind.getBoundingClientRect();
          jump(ind, false);
        } else {
          jump(ind, true);
          set({ ...to, x: at.x, y: at.y }, at.w / to.w, at.h / to.h);
          ind.getBoundingClientRect();
          jump(ind, false);
          set(to);
        }
        at = to;
        instant = false;
      };
      place();
      new MutationObserver(place).observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
      new ResizeObserver(() => {
        instant = true;
        place();
      }).observe(list);
      (_a = document.fonts) == null ? void 0 : _a.ready.then(() => {
        instant = true;
        place();
      });
    });
  }
  var NUM = /\d+(?:[.,\u00A0\u202F]\d+)*/;
  function parse(text) {
    const m = text.match(NUM);
    if (!m) return null;
    const raw = m[0];
    const seps = raw.match(/[^\d]/g) || [];
    let dec = "", group = "", decimals = 0;
    const lastSep = raw.search(/[^\d](?=\d+$)/);
    if (lastSep >= 0) {
      const tail = raw.length - lastSep - 1;
      if (tail === 3 && !(seps.length === 1 && raw[lastSep] === "." && /^0/.test(raw))) group = raw[lastSep];
      else {
        dec = raw[lastSep];
        decimals = tail;
        group = seps.length > 1 ? seps[0] : "";
      }
    }
    const intPart = dec ? raw.slice(0, lastSep) : raw;
    const value = parseFloat(intPart.replace(/[^\d]/g, "") + (dec ? "." + raw.slice(lastSep + 1) : ""));
    return { index: m.index, raw, value, dec, group, decimals };
  }
  function format(v, p) {
    let [i, d] = v.toFixed(p.decimals).split(".");
    if (p.group) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, p.group);
    return d ? i + p.dec + d : i;
  }
  var fontsIn = () => {
    var _a, _b;
    return Promise.race([(_b = (_a = document.fonts) == null ? void 0 : _a.ready) != null ? _b : Promise.resolve(), new Promise((r) => setTimeout(r, 3e3))]);
  };
  function counts() {
    const els = [...document.querySelectorAll("[data-m-count]")].filter((el) => !el.__mCount);
    if (!els.length || reduced() || shot()) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      var _a;
      if (e.isIntersecting) (_a = e.target.__mCount) == null ? void 0 : _a.hit();
    }), { threshold: 0.6 });
    const ro = new ResizeObserver((es) => es.forEach((e) => {
      var _a;
      return (_a = e.target.__mCount) == null ? void 0 : _a.arm();
    }));
    const items = [];
    els.forEach((el) => {
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node, p;
      while ((node = walk.nextNode()) && !(p = parse(node.data))) {
      }
      if (!node || !p) return;
      const after = node.splitText(p.index);
      after.splitText(p.raw.length);
      const span = document.createElement("span");
      span.className = "m-count__n";
      span.style.display = "inline-block";
      span.style.textAlign = "right";
      span.textContent = p.raw;
      after.replaceWith(span);
      const ms = +el.dataset.mCount || 1200;
      let state = "wait", timer = 0;
      const stop = () => {
        clearTimeout(timer);
        io.unobserve(el);
        ro.unobserve(el);
      };
      const onScreen = () => {
        const r = span.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && document.visibilityState === "visible";
      };
      const watch = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (state !== "armed") return;
          if (onScreen()) {
            state = "done";
            stop();
            span.textContent = p.raw;
          } else watch();
        }, 6e3);
      };
      const ctl = {
        /** measure the final number in the page's font and hold its width; false while it has none (hidden) */
        arm() {
          if (state === "run" || state === "done") return false;
          span.textContent = p.raw;
          span.style.minWidth = "";
          const w = span.getBoundingClientRect().width;
          if (!w) {
            state = "wait";
            clearTimeout(timer);
            return false;
          }
          span.style.minWidth = `${w}px`;
          span.textContent = format(0, p);
          if (state !== "armed") {
            state = "armed";
            watch();
          }
          return true;
        },
        /** print: stop waiting and show the written number */
        show() {
          if (state === "done") return;
          state = "done";
          stop();
          span.textContent = p.raw;
        },
        /** first seen: measure again (a font or a tab that changed since), then tick once */
        hit() {
          if (state === "run" || state === "done" || !ctl.arm()) return;
          state = "run";
          stop();
          const t0 = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - t0) / ms);
            span.textContent = k < 1 ? format(p.value * (1 - Math.pow(1 - k, 4)), p) : p.raw;
            if (k < 1) requestAnimationFrame(step);
            else state = "done";
          };
          requestAnimationFrame(step);
        }
      };
      el.__mCount = ctl;
      items.push(el);
    });
    fontsIn().then(() => items.forEach((el) => {
      el.__mCount.arm();
      ro.observe(el);
      io.observe(el);
    }));
    addEventListener("beforeprint", () => items.forEach((el) => el.__mCount.show()));
  }
  var ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.25" y="3.25" width="2.75" height="9.5" rx="0.9"/><rect x="9" y="3.25" width="2.75" height="9.5" rx="0.9"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.25 3.7v8.6c0 .62.68 1 1.2.66l6.5-4.3c.47-.31.47-1 0-1.32l-6.5-4.3c-.52-.34-1.2.04-1.2.66Z"/></svg>';
  var boxOf = (el) => el.closest("[data-ui-pause-host], .panel__screen, .panel, .frame") || el;
  var hostOf = (el) => el.closest(".card, .tile, .menu-card, a") || boxOf(el);
  function restart(loop) {
    if (reduced() || loop.classList.contains("is-m-paused")) return;
    const anims = loop.getAnimations({ subtree: true }).filter((a) => typeof CSSAnimation === "function" && a instanceof CSSAnimation);
    if (!anims.length) return;
    const dur = (a) => {
      var _a;
      return Number((_a = a.effect) == null ? void 0 : _a.getComputedTiming().duration) || 0;
    };
    const main = anims.reduce((m, a) => dur(a) > dur(m) ? a : m);
    const d = dur(main), t = Number(main.currentTime) || 0;
    if (!d || t % d / d > 0.25) anims.forEach((a) => {
      a.currentTime = 0;
    });
  }
  function setPaused(box, paused) {
    box.querySelectorAll("[data-m-loop]").forEach((l) => l.classList.toggle("is-m-paused", paused));
    if (box.matches("[data-m-loop]")) box.classList.toggle("is-m-paused", paused);
  }
  function pauseButton(loop) {
    const box = boxOf(loop);
    if (box.querySelector(":scope > .loop-pause")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "loop-pause m-own";
    const show = (paused) => {
      btn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
      btn.setAttribute("aria-label", `${paused ? "Play" : "Pause"} animation`);
      btn.title = btn.getAttribute("aria-label");
      btn.classList.toggle("is-paused", paused);
    };
    show(false);
    if (getComputedStyle(box).position === "static") box.style.position = "relative";
    box.append(btn);
    btn.__show = show;
  }
  function loops() {
    const els = [...document.querySelectorAll("[data-m-loop]")].filter((el) => !el.__mLoop);
    if (!els.length) return;
    if (reduced() || matchMedia("(max-width: 639px)").matches) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-m-off", !e.isIntersecting)), { rootMargin: "48px" });
    els.forEach((el) => {
      el.__mLoop = true;
      io.observe(el);
      pauseButton(el);
      hostOf(el).addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") restart(el);
      });
      hostOf(el).addEventListener("focusin", (e) => {
        if (!e.target.closest(".loop-pause")) restart(el);
      });
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".loop-pause");
    if (!btn) return;
    const box = btn.parentElement;
    if (btn.classList.contains("m-own")) {
      const paused = !btn.classList.contains("is-paused");
      btn.__show(paused);
      setPaused(box, paused);
      box.querySelectorAll("[data-ui]").forEach((r) => {
        var _a, _b;
        try {
          paused ? (_a = r.__ui) == null ? void 0 : _a.pause() : (_b = r.__ui) == null ? void 0 : _b.resume();
        } catch (e2) {
        }
      });
    } else setPaused(box, btn.classList.contains("is-paused"));
  });
  document.addEventListener("click", (e) => {
    const sw = e.target.closest(".m-switch");
    if (!sw || e.defaultPrevented) return;
    sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
  });
  var ENTER_MEDIA = "[data-enter-media], .hero__bg, .hero__media, .hero__stage, .hero__art, .hero__window, .hero-visual, .ly-collage";
  var ENTER_TEXT = "h1 ~ *, :has(> h1) ~ *, :has(~ h1)";
  var ENTER_LEAF = "p, dl, ul, ol, a, button, img, picture, video, figure, blockquote, h2, h3, .pill, .btn";
  function maskWords(h1) {
    if (h1.matches("[data-ly-letters], [data-enter-whole]") || h1.querySelector(".ly-word, .ly-pic, .ly-mark, svg, img")) return null;
    const own = document.createDocumentFragment();
    own.append(...h1.childNodes);
    const copy = own.cloneNode(true);
    const words = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          return;
        }
        const w = document.createElement("span"), i = document.createElement("span");
        w.className = "m-w";
        i.className = "m-w__in";
        i.textContent = part;
        w.append(i);
        frag.append(w);
        words.push(w);
      });
      n.replaceWith(frag);
    });
    walk(copy);
    const label = h1.hasAttribute("aria-label");
    if (!label) h1.setAttribute("aria-label", own.textContent.replace(/\s+/g, " ").trim());
    h1.append(copy);
    h1.querySelectorAll(".m-w").forEach((w) => w.setAttribute("aria-hidden", "true"));
    const lines2 = [];
    let top = null;
    words.forEach((w) => {
      const t = w.getBoundingClientRect().top;
      if (top === null || Math.abs(t - top) > 3) {
        lines2.push([]);
        top = t;
      }
      lines2[lines2.length - 1].push(w.firstChild);
    });
    return { lines: lines2, restore() {
      h1.replaceChildren(own);
      if (!label) h1.removeAttribute("aria-label");
    } };
  }
  function enterSteps(hero, h1, media) {
    const out = [];
    const take = (el) => {
      if (el === h1 || el.contains(h1) || out.includes(el) || el.matches("img, picture, video, canvas, .frame__img")) return;
      if (media.includes(el) || media.some((m) => el.contains(m))) return;
      if (el.matches(".btn-row")) {
        [...el.children].forEach(take);
        return;
      }
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (own || !el.children.length || el.matches(ENTER_LEAF)) out.push(el);
      else [...el.children].forEach(take);
    };
    hero.querySelectorAll(ENTER_TEXT).forEach(take);
    return out.filter((el) => !el.closest('[aria-hidden="true"]') && !out.some((o) => o !== el && o.contains(el))).sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  }
  function enter() {
    var _a, _b;
    const hero = document.querySelector('.hero[data-enter]:not([data-enter="off"])');
    if (!hero || hero.classList.contains("is-entered") || hero.classList.contains("is-entering")) return;
    const done = (still2 = false) => {
      if (still2) hero.classList.add("is-still");
      hero.classList.add("is-entered");
    };
    const late = () => setTimeout(done, 1150);
    if (!html.classList.contains("m-enter") || reduced() || shot() || hero.getBoundingClientRect().bottom < 0) return done(true);
    if (html.classList.contains("m-enter-done")) return late();
    const h1 = hero.querySelector("h1");
    if (!h1) return done(true);
    const media = [...hero.querySelectorAll(ENTER_MEDIA)].filter((m, i, all) => !all.some((o) => o !== m && o.contains(m)));
    const steps = enterSteps(hero, h1, media);
    const EASE = "cubic-bezier(.22, 1, .36, 1)";
    const anims = [];
    let masks = null, over = false;
    const finish = () => {
      if (over) return;
      over = true;
      anims.forEach((a) => {
        try {
          a.cancel();
        } catch (e) {
        }
      });
      masks == null ? void 0 : masks.restore();
      hero.classList.remove("is-entering");
      done();
    };
    Promise.race([(_b = (_a = document.fonts) == null ? void 0 : _a.ready) != null ? _b : Promise.resolve(), new Promise((r) => setTimeout(r, 250))]).then(() => {
      if (html.classList.contains("m-enter-done") && !hero.classList.contains("is-entering")) {
        over = true;
        return late();
      }
      masks = maskWords(h1);
      hero.classList.add("is-entering");
      const lines2 = masks ? masks.lines : [[h1]];
      const lineStep = Math.min(80, 240 / Math.max(1, lines2.length - 1));
      lines2.forEach((ws, k2) => ws.forEach((w) => anims.push(w.animate(
        masks ? [{ transform: "translateY(calc(100% + .2em))" }, { transform: "none" }] : [{ transform: "translateY(.35em)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 700, delay: 80 + k2 * lineStep, easing: EASE, fill: "both" }
      ))));
      const after = 80 + (lines2.length - 1) * lineStep + 220;
      let k = 0;
      steps.forEach((el) => {
        const above = !!(el.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING);
        const t = { duration: 520, delay: above ? 40 : after + Math.min(k++, 6) * 60, easing: EASE, fill: "both" };
        anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], t), el.animate([{ transform: "translateY(12px)" }, { transform: "none" }], { ...t, composite: "add" }));
      });
      anims.push({ finished: new Promise((r) => setTimeout(r, 1150)), cancel() {
      } });
      Promise.all(anims.map((a) => a.finished)).then(finish, finish);
    }).catch(finish);
    setTimeout(finish, 2400);
  }
  function init() {
    var _a;
    if (html.dataset.motion === "off") {
      html.classList.add("m-enter-done");
      return;
    }
    if (!html.hasAttribute("data-motion")) html.setAttribute("data-motion", "");
    try {
      enter();
    } catch (e) {
      console.warn("motion.js: enter", e);
      (_a = document.querySelector(".hero[data-enter]")) == null ? void 0 : _a.classList.add("is-entered");
    }
    try {
      nav();
    } catch (e) {
      console.warn("motion.js: nav", e);
    }
    try {
      tabs();
    } catch (e) {
      console.warn("motion.js: tabs", e);
    }
    try {
      counts();
    } catch (e) {
      console.warn("motion.js: counts", e);
    }
    try {
      loops();
    } catch (e) {
      console.warn("motion.js: loops", e);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  // work/2cakes-studio/source/vendor/moments/lib.js
  var lib_exports = {};
  __export(lib_exports, {
    blocks: () => blocks,
    clamp: () => clamp,
    coarse: () => coarse,
    ease: () => ease,
    fontsReady: () => fontsReady,
    inCard: () => inCard,
    lerp: () => lerp,
    lines: () => lines,
    once: () => once,
    phone: () => phone,
    reduced: () => reduced2,
    scrub: () => scrub,
    split: () => split,
    still: () => still,
    stillWhy: () => stillWhy
  });
  var rq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced2 = () => !!(rq && rq.matches);
  var pq = typeof matchMedia === "function" ? [matchMedia("(max-width: 639px)"), matchMedia("(pointer: coarse) and (max-height: 499px) and (max-width: 959px)")] : [];
  var phone = () => pq.some((q) => q.matches);
  var still = () => reduced2() || phone();
  var stillWhy = () => reduced2() ? "reduced" : phone() ? "phone" : "";
  var inCard = (el) => !!(el && el.closest && el.closest(".card, .plan, .result, .knock, [data-card], .bento > *"));
  var coarse = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  var clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  var ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    quint: (t) => 1 - Math.pow(1 - t, 5),
    expo: (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    smooth: (a, b, x) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    }
  };
  function scrub(el, fn, { mode = "hold", margin = "25% 0px" } = {}) {
    let on = true, raf = 0, last = -1;
    const tick = () => {
      raf = 0;
      if (!on) return;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      let p = mode === "view" ? (vh - r.top) / (vh + r.height) : -r.top / Math.max(1, r.height - vh);
      p = clamp(p);
      if (p !== last) {
        last = p;
        fn(p, r);
      }
    };
    const req = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => {
      on = es[es.length - 1].isIntersecting;
      removeEventListener("scroll", req);
      removeEventListener("resize", req);
      if (on) {
        addEventListener("scroll", req, { passive: true });
        addEventListener("resize", req);
        req();
      }
    }, { rootMargin: margin });
    io.observe(el);
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);
    req();
    return {
      update: () => {
        last = -1;
        req();
      },
      destroy() {
        io.disconnect();
        removeEventListener("scroll", req);
        removeEventListener("resize", req);
        if (raf) cancelAnimationFrame(raf);
      }
    };
  }
  function once(el, fn, { threshold = 0.35, margin = "0px", rescue = 3e3 } = {}) {
    let timer = 0, starve = 0, done = false;
    const go = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(starve);
      io.disconnect();
      fn();
    };
    const steps = [0];
    for (let t = 0.1; t < threshold - 1e-6; t += 0.1) steps.push(+t.toFixed(2));
    steps.push(threshold);
    const io = new IntersectionObserver((es) => {
      clearTimeout(starve);
      const e = es[es.length - 1];
      if (!e.isIntersecting) {
        clearTimeout(timer);
        timer = 0;
        return;
      }
      const vh = e.rootBounds ? e.rootBounds.height : innerHeight;
      if (e.intersectionRatio >= threshold || e.intersectionRect.height >= vh * threshold) return go();
      if (!timer) timer = setTimeout(go, rescue);
    }, { threshold: steps, rootMargin: margin });
    const wait = () => {
      starve = setTimeout(() => document.hidden ? wait() : go(), 1500);
    };
    wait();
    io.observe(el);
    return { destroy() {
      done = true;
      clearTimeout(timer);
      clearTimeout(starve);
      io.disconnect();
    } };
  }
  function split(el, unit = "words") {
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const inners = [];
    const wrap = (text, cls) => {
      const s = document.createElement("span");
      s.className = cls;
      const i = document.createElement("span");
      i.className = "mo-i";
      i.textContent = text;
      s.append(i);
      inners.push(i);
      return s;
    };
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.append(" ");
              return;
            }
            if (unit === "chars") {
              const w = document.createElement("span");
              w.className = "mo-w";
              for (const ch of part) w.append(wrap(ch, "mo-c"));
              frag.append(w);
            } else frag.append(wrap(part, "mo-w"));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("mo-w")) {
          if (n.matches("a[href], button") && !n.getAttribute("aria-label") && n.textContent.trim()) n.setAttribute("aria-label", n.textContent.replace(/\s+/g, " ").trim());
          walk(n);
        }
      });
    };
    walk(el);
    el.querySelectorAll(".mo-w").forEach((w) => w.setAttribute("aria-hidden", "true"));
    return inners;
  }
  function lines(words) {
    const out = [];
    let top = null;
    for (const w of words) {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 2) {
        out.push([]);
        top = t;
      }
      out[out.length - 1].push(w);
    }
    return out;
  }
  var fontsReady = (ms = 900) => Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);
  var BLOCK = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figcaption,label,a,button,img,picture,video,canvas,svg,table,figure,.frame,.dw,[data-moment-block]";
  function blocks(root, skip = []) {
    const list = [];
    const walk = (el) => {
      for (const c of el.children) {
        if (skip.includes(c) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(c.tagName)) continue;
        const own = [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (c.matches(BLOCK) || own) list.push({ el: c, was: c.style.opacity, l: 0, t: 0, r: 0, b: 0 });
        else walk(c);
      }
    };
    walk(root);
    const measure = () => {
      const rr = root.getBoundingClientRect();
      for (const b of list) {
        const r = b.el.getBoundingClientRect();
        b.l = r.left - rr.left;
        b.t = r.top - rr.top;
        b.r = r.right - rr.left;
        b.b = r.bottom - rr.top;
      }
    };
    measure();
    const set = (fn) => {
      for (const b of list) {
        const o = fn(b);
        b.el.style.opacity = o >= 0.999 ? b.was : o <= 0 ? "0" : o.toFixed(3);
      }
    };
    const release = () => {
      for (const b of list) b.el.style.opacity = b.was;
    };
    return { list, measure, set, release };
  }

  // work/2cakes-studio/source/vendor/moments/word-highlight/moment.js
  function moment_default(root, opts, lib) {
    var _a, _b;
    const text = root.matches("p, h2, h3, blockquote") ? root : root.querySelector(".mo-wh__text") || [...root.querySelectorAll("p, h2, h3, blockquote")].find((p) => !p.matches(".t-label, .t-small, .muted"));
    if (!text) return {};
    root.classList.add("mo-wh");
    const words = lib.split(text, "words").map((i) => i.parentElement);
    if (lib.reduced()) {
      words.forEach((w) => w.classList.add("is-on"));
      root.classList.add("is-done");
      return {};
    }
    const from = (_a = opts.from) != null ? _a : 0.85, to = (_b = opts.to) != null ? _b : 0.45;
    let n = -1;
    const s = lib.scrub(text, (p, r) => {
      const vh = innerHeight, start = vh * from, end = vh * to;
      const t = lib.clamp((start - r.top) / Math.max(1, start - end + r.height));
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      const k = atEnd ? words.length : Math.round(t * words.length);
      if (k === n) return;
      n = k;
      words.forEach((w, i) => w.classList.toggle("is-on", i < k));
    }, { mode: "view" });
    return { destroy: s.destroy };
  }

  // work/2cakes-studio/source/vendor/moments/picture-develops/moment.js
  var otherPage = () => {
    const m = document.querySelector('meta[name="site-kind"]');
    return document.documentElement.dataset.type === "place" || !!m && m.content.trim().toLowerCase() === "other";
  };
  function moment_default2(root, opts, lib) {
    const img = root.querySelector("img");
    if (!img) return {};
    root.classList.add("mo-pd");
    if (lib.reduced()) {
      root.classList.add("is-done");
      return {};
    }
    if ((opts.look || (otherPage() ? "film" : "print")) === "film") return film(root, img, opts, lib);
    if (lib.phone()) {
      root.dataset.momentStill = "phone";
      root.classList.add("is-done");
      return {};
    }
    const cell = Math.max(6, Math.min(14, +opts.cell || 9));
    const dur = Math.max(900, +opts.duration || 1800);
    const [fx, fy] = Array.isArray(opts.focus) ? opts.focus : [0.5, 0.5];
    const canvas = document.createElement("canvas");
    canvas.className = "mo-pd__print";
    canvas.setAttribute("aria-hidden", "true");
    root.append(canvas);
    root.classList.add("is-live");
    let raf = 0, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (raf) cancelAnimationFrame(raf);
      canvas.remove();
      root.classList.remove("is-live");
      root.classList.add("is-done");
    };
    const tokens = () => {
      const cs = getComputedStyle(root);
      return { bg: cs.getPropertyValue("--surface").trim() || cs.getPropertyValue("--bg").trim() || "#f4f4f4", ink: cs.getPropertyValue("--ink").trim() || "#111" };
    };
    const sample = () => {
      const w = root.clientWidth, h = root.clientHeight;
      if (!w || !h || !img.naturalWidth) return null;
      canvas.width = w;
      canvas.height = h;
      const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const ox = off.getContext("2d", { willReadFrequently: true });
      const ir = img.naturalWidth / img.naturalHeight, fr = w / h;
      let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
      if (ir > fr) {
        sw = sh * fr;
        sx = (img.naturalWidth - sw) * fx;
      } else {
        sh = sw / fr;
        sy = (img.naturalHeight - sh) * fy;
      }
      ox.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      let data;
      try {
        data = ox.getImageData(0, 0, cols, rows).data;
      } catch (e) {
        return null;
      }
      const dark = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) dark[i] = 1 - (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
      return { cols, rows, dark };
    };
    const draw = (g, t) => {
      const ctx = canvas.getContext("2d");
      const { bg, ink } = tokens();
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      const thr = 1 - t * 1.12;
      const half = cell / 2;
      ctx.beginPath();
      for (let r = 0; r < g.rows; r++) {
        const shift = r & 1 ? half * 0.5 : -half * 0.5;
        for (let c = 0; c < g.cols; c++) {
          const d = g.dark[r * g.cols + c];
          if (d <= thr) continue;
          const k = Math.min(1, (d - thr) / 0.22);
          const rad = half * Math.min(1, d * 1.15) * k;
          if (rad < 0.35) continue;
          const x = c * cell + half + shift, y = r * cell + half;
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, 6.2832);
        }
      }
      ctx.fill();
    };
    const run = async () => {
      var _a;
      try {
        if (!img.complete) await new Promise((r, j) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", j, { once: true });
        });
        await ((_a = img.decode) == null ? void 0 : _a.call(img));
      } catch (e) {
      }
      const g = sample();
      if (!g) return finish();
      root.classList.add("is-developing");
      let t0 = 0;
      const step = (now) => {
        if (done) return;
        if (!t0) t0 = now;
        const u = Math.min(1, (now - t0) / dur);
        if (u < 0.58) {
          draw(g, 0.14 + lib.ease.out(u / 0.58) * 0.86);
          canvas.style.opacity = "1";
        } else {
          canvas.style.opacity = String(1 - lib.ease.smooth(0.58, 1, u));
        }
        if (u < 1) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
    };
    canvas.style.display = "none";
    root.classList.remove("is-live");
    const cover = () => {
      if (done) return;
      canvas.style.display = "";
      root.classList.add("is-live");
    };
    const r0 = root.getBoundingClientRect();
    if (r0.bottom > 0 && r0.top < innerHeight * 1.25) cover();
    const arm = lib.once(root, cover, { threshold: 0, margin: "0px 0px 25% 0px" });
    const seen = lib.once(root, () => {
      cover();
      run();
    }, { threshold: Math.min(0.4, 0.6 * innerHeight / Math.max(1, root.getBoundingClientRect().height)) });
    return { destroy() {
      arm.destroy();
      seen.destroy();
      finish();
    } };
  }
  function film(root, img, opts, lib) {
    const dur = Math.max(1e3, +opts.duration || 1600);
    let done = false, anim = null;
    root.classList.add("mo-pd--film");
    const finish = () => {
      if (done) return;
      done = true;
      anim == null ? void 0 : anim.cancel();
      root.classList.remove("is-armed", "is-live");
      root.classList.add("is-done");
    };
    const arm = () => {
      if (!done) root.classList.add("is-armed");
    };
    const run = async () => {
      if (done) return;
      arm();
      try {
        if (!img.complete) await new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
        });
      } catch (e) {
      }
      if (done) return;
      root.classList.add("is-live");
      anim = img.animate([
        { filter: "grayscale(1) contrast(.55) brightness(1.32)", transform: "scale(1.06)" },
        { filter: "grayscale(.8) contrast(.82) brightness(1.14)", offset: 0.3 },
        { filter: "grayscale(.35) contrast(.95) brightness(1.04)", offset: 0.62 },
        { filter: "grayscale(0) contrast(1) brightness(1)", transform: "none" }
      ], { duration: dur, easing: "cubic-bezier(.3, .2, .3, 1)", fill: "both" });
      root.classList.remove("is-armed");
      anim.finished.then(finish, finish);
    };
    const r0 = root.getBoundingClientRect();
    if (r0.bottom > 0 && r0.top < innerHeight * 1.25) arm();
    const near = lib.once(root, arm, { threshold: 0, margin: "0px 0px 25% 0px" });
    const seen = lib.once(root, run, { threshold: Math.min(0.25, 0.4 * innerHeight / Math.max(1, r0.height)) });
    return { destroy() {
      near.destroy();
      seen.destroy();
      finish();
    } };
  }

  // work/2cakes-studio/source/animations-entry.js
  var mounts = { "word-highlight": moment_default, "picture-develops": moment_default2 };
  document.querySelectorAll("[data-moment]").forEach((root) => {
    try {
      root.__moment = mounts[root.dataset.moment](root, JSON.parse(root.dataset.momentOpts || "{}"), lib_exports);
      root.dataset.momentMounted = "1";
    } catch (e) {
      root.classList.add("is-done");
    }
  });
})();
