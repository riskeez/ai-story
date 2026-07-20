// ОБЩИЙ ДВИЖОК РИДЕРА — клиентский остров.
// Разметка теперь рендерится на сервере (см. stories/[...slug].astro). Здесь только
// интерактив: тема, размер шрифта, звёзды, музыка, заставка, появление.
(function () {
  "use strict";

  const LS = {
    THEME: "sssr2061-theme",
    FONT: "sssr2061-font",
    TIME: "sssr2061-atime",
    PAUSED: "sssr2061-apaused",
  };
  const htmlEl = document.documentElement;
  const $ = (id: string) => document.getElementById(id);

  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;

  let theme = localStorage.getItem(LS.THEME) || htmlEl.getAttribute("data-theme") || "night";
  let fontSize = parseInt(localStorage.getItem(LS.FONT) || "20", 10);
  let userPaused = localStorage.getItem(LS.PAUSED) === "1";

  const storyEl = $("storyContent");
  const btnTheme = $("btnTheme"),
    iconSun = $("iconSun"),
    iconMoon = $("iconMoon");
  const btnFontDec = $("btnFontDec"),
    btnFontInc = $("btnFontInc");
  const introEl = $("intro"),
    introBtnEl = $("introBtn");

  // ── Тема ──
  function applyTheme(t: string) {
    theme = t;
    htmlEl.setAttribute("data-theme", t);
    if (iconSun) iconSun.style.display = t === "night" ? "" : "none";
    if (iconMoon) iconMoon.style.display = t === "day" ? "" : "none";
    try {
      localStorage.setItem(LS.THEME, t);
    } catch (e) {}
  }
  applyTheme(theme);
  btnTheme?.addEventListener("click", () =>
    applyTheme(theme === "night" ? "day" : "night")
  );

  // ── Размер шрифта ──
  function applyFont(s: number) {
    fontSize = Math.max(16, Math.min(26, s));
    storyEl?.style.setProperty("--reading", String(fontSize / 20));
    try {
      localStorage.setItem(LS.FONT, String(fontSize));
    } catch (e) {}
  }
  applyFont(fontSize);
  btnFontDec?.addEventListener("click", () => applyFont(fontSize - 1));
  btnFontInc?.addEventListener("click", () => applyFont(fontSize + 1));

  // ── Звёздное небо (число звёзд ~ площадь вьюпорта, 90…230) ──
  const starfield = $("starfield");
  if (starfield) {
    const starCount = Math.max(90, Math.min(230, Math.round((vw * vh) / 9000)));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < starCount; i++) {
      const big = Math.random() < 0.12;
      const el = document.createElement("i");
      if (big) el.className = "bigstar";
      const sz = big ? Math.random() * 1.6 + 1.8 : Math.random() * 1.3 + 0.5;
      el.style.cssText = [
        "top:" + (Math.random() * 100).toFixed(2) + "%",
        "left:" + (Math.random() * 100).toFixed(2) + "%",
        "width:" + sz.toFixed(2) + "px",
        "height:" + sz.toFixed(2) + "px",
        "animation-delay:" + (Math.random() * 6).toFixed(2) + "s",
        "opacity:" +
          (big
            ? (Math.random() * 0.35 + 0.55).toFixed(2)
            : (Math.random() * 0.5 + 0.2).toFixed(2)),
      ].join(";");
      frag.appendChild(el);
    }
    starfield.appendChild(frag);
  }

  // ── Музыка ──
  const audio = $("bgAudio") as HTMLAudioElement | null;
  const btnAudio = $("btnAudio"),
    iconNote = $("iconNote"),
    iconEq = $("iconEq");
  if (audio && btnAudio) {
    audio.volume = 0.55;
    const savedTime = parseFloat(localStorage.getItem(LS.TIME) || "0");
    if (isFinite(savedTime) && savedTime > 0) {
      try {
        audio.currentTime = savedTime;
      } catch (e) {}
    }

    let lastSave = 0;
    audio.addEventListener("timeupdate", function () {
      const n = Date.now();
      if (n - lastSave > 2500) {
        lastSave = n;
        try {
          localStorage.setItem(LS.TIME, String(audio.currentTime || 0));
        } catch (e) {}
      }
    });

    const setPlaying = function (p: boolean) {
      btnAudio.classList.toggle("on", p);
      if (iconNote) iconNote.style.display = p ? "none" : "";
      if (iconEq) iconEq.style.display = p ? "" : "none";
    };
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (!audio.paused) audio.pause();
      } else if (!userPaused && audio.paused) {
        audio.play().catch(() => {});
      }
    });

    btnAudio.addEventListener("click", function () {
      if (audio.paused) {
        userPaused = false;
        try {
          localStorage.setItem(LS.PAUSED, "0");
        } catch (e) {}
        audio.play().catch(() => {});
      } else {
        userPaused = true;
        try {
          localStorage.setItem(LS.PAUSED, "1");
        } catch (e) {}
        audio.pause();
      }
    });
  }

  // ── Экран заставки ──
  introBtnEl?.addEventListener("click", function () {
    document.body.classList.remove("intro-open");
    introEl?.classList.add("hiding");
    introEl?.addEventListener("transitionend", () => introEl.remove(), {
      once: true,
    });
    if (audio && !userPaused) audio.play().catch(() => {});

    // Пока заставка растворяется — подтянуть страницу к заголовку мастхеда.
    const anchor = document.querySelector(".masthead .hero-cap");
    if (anchor) {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = anchor.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  });

  // ── Анимация появления ──
  const revealDone = () => htmlEl.classList.add("reveal-done");
  if (document.hidden) revealDone();
  else setTimeout(revealDone, 1150);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) revealDone();
  });
})();
