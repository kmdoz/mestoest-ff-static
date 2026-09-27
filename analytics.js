(() => {
  if (/^\/(?:admin|site-preview)(?:\/|$)/.test(window.location.pathname)) return;
  let enabled = false;
  let initialized = false;

  const fallbackCounterId = "111877488";
  const getCounterId = () => String(
    document.body?.dataset.yandexMetrikaId || fallbackCounterId,
  ).trim();

  const initializeMetrika = () => {
    const counterId = getCounterId();
    if (!enabled || initialized || !/^\d{6,12}$/.test(counterId)) return false;

    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
    document.head.appendChild(script);
    window.ym(Number(counterId), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
    initialized = true;
    return true;
  };

  window.mestoestEnableAnalytics = () => {
    enabled = true;
    return initializeMetrika();
  };

  window.mestoestDisableAnalytics = () => { enabled = false; };

  window.mestoestTrack = (eventName, parameters = {}) => {
    if (!enabled || !/^[a-z0-9_]{2,64}$/.test(String(eventName))) return false;
    const counterId = getCounterId();
    if (!initialized && !initializeMetrika()) return false;
    window.ym?.(Number(counterId), "reachGoal", eventName, parameters);
    return true;
  };

  document.addEventListener("click", (event) => {
    const tracked = event.target.closest("[data-track]");
    if (tracked) window.mestoestTrack(tracked.dataset.track);
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (href.startsWith("tel:")) window.mestoestTrack("phone_click");
    else if (href.includes("wa.me")) window.mestoestTrack("whatsapp_click");
    else if (href.includes("t.me")) window.mestoestTrack("telegram_click");
    else if (href.includes("max.ru")) window.mestoestTrack("max_click");
    else if (href.includes("yandex.ru/maps")) window.mestoestTrack("route_click");
  });

  const viewed = new WeakSet();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || viewed.has(entry.target)) return;
      viewed.add(entry.target);
      window.mestoestTrack(entry.target.dataset.trackView);
    });
  }, { threshold: 0.45 });
  document.querySelectorAll("[data-track-view]").forEach((element) => observer.observe(element));
})();
