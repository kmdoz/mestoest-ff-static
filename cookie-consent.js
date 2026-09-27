(() => {
  if (/^\/(?:admin|site-preview)(?:\/|$)/.test(window.location.pathname)) return;
  const STORAGE_KEY = "mestoest_cookie_preferences_v2";
  const VALID_FOR_MS = 365 * 24 * 60 * 60 * 1000;
  const banner = document.querySelector("[data-cookie-banner]");

  const readPreference = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || !["essential", "map", "all"].includes(stored.choice)) return null;
      if (Date.now() - Number(stored.savedAt) > VALID_FOR_MS) return null;
      return stored.choice;
    } catch {
      return null;
    }
  };

  const savePreference = (choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, savedAt: Date.now() }));
    } catch {
      // The site still works when storage is unavailable; the banner may reappear next time.
    }
  };

  const enableYandexMap = () => {
    document.querySelectorAll('[data-cookie-service="yandex-map"]').forEach((frame) => {
      if (!frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src || "");
      frame.hidden = false;
    });
    document.querySelectorAll("[data-map-placeholder]").forEach((item) => { item.hidden = true; });
    document.querySelectorAll("[data-map-overlay]").forEach((item) => { item.hidden = false; });
  };

  const disableYandexMap = () => {
    document.querySelectorAll('[data-cookie-service="yandex-map"]').forEach((frame) => {
      frame.removeAttribute("src");
      frame.hidden = true;
    });
    document.querySelectorAll("[data-map-placeholder]").forEach((item) => { item.hidden = false; });
    document.querySelectorAll("[data-map-overlay]").forEach((item) => { item.hidden = true; });
  };

  const applyPreference = (choice) => {
    if (choice === "map" || choice === "all") enableYandexMap();
    else disableYandexMap();
    if (choice === "all") window.mestoestEnableAnalytics?.();
    else window.mestoestDisableAnalytics?.();
    if (banner) banner.hidden = true;
  };

  const choose = (choice) => {
    savePreference(choice);
    applyPreference(choice);
  };

  document.querySelectorAll("[data-cookie-map], [data-cookie-enable-map]").forEach((button) => {
    button.addEventListener("click", () => choose("map"));
  });
  document.querySelectorAll("[data-cookie-accept]").forEach((button) => {
    button.addEventListener("click", () => choose("all"));
  });
  document.querySelectorAll("[data-cookie-essential]").forEach((button) => {
    button.addEventListener("click", () => choose("essential"));
  });
  document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
    button.addEventListener("click", () => {
      if (banner) banner.hidden = false;
    });
  });

  const preference = readPreference();
  if (preference) applyPreference(preference);
  else if (banner) banner.hidden = false;
})();
