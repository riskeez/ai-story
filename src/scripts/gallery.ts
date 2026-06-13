// ВИТРИНА — клиентский остров: фильтр по тегам + фон у липкого фильтра.
// Карточки отрендерены на сервере (data-tags="тег|тег"); фильтр прячет/показывает.
(function () {
  "use strict";

  const filters = document.getElementById("filters");
  const grid = document.getElementById("grid");
  if (!filters || !grid) return;

  const cards = Array.from(grid.querySelectorAll<HTMLElement>(".card"));

  // фильтр по тегам (делегирование)
  filters.addEventListener("click", function (e) {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".chip");
    if (!btn) return;
    const active = btn.getAttribute("data-tag") || "Все";
    filters.querySelectorAll<HTMLElement>(".chip").forEach(function (c) {
      c.setAttribute("data-on", c === btn ? "1" : "0");
    });
    cards.forEach(function (card) {
      const tags = (card.getAttribute("data-tags") || "").split("|");
      const show = active === "Все" || tags.indexOf(active) !== -1;
      card.style.display = show ? "" : "none";
    });
  });

  // фон у фильтра, когда он прилип к верху: 1px-сентинел перед ним
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "height:1px;margin-bottom:-1px;pointer-events:none";
  filters.parentNode!.insertBefore(sentinel, filters);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        filters.classList.toggle("stuck", !entries[0].isIntersecting);
      },
      { threshold: 0 }
    ).observe(sentinel);
  } else {
    const onScroll = function () {
      filters.classList.toggle("stuck", filters.getBoundingClientRect().top <= 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // страховка появления
  setTimeout(function () {
    document.documentElement.classList.add("reveal-done");
  }, 1400);
})();
