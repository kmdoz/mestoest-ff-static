(() => {
  if (/^\/admin(?:\/|$)/.test(window.location.pathname)) return;
  const form = document.querySelector("[data-request-form]");
  if (!form) return;

  const scenarioLabels = {
    storage: "только хранение",
    fbo: "поставка FBO партиями",
    "fbs-ready": "FBS — товар уже упакован",
    "fbs-full": "FBS — полный цикл",
    labeling: "маркировка или переупаковка",
  };
  const marketplaceLabels = {
    wb: "Wildberries",
    ozon: "Ozon",
    ym: "Yandex Market",
    several: "несколько маркетплейсов",
    none: "без маркетплейса",
  };
  const packagingLabels = {
    ready: "товар уже упакован",
    needed: "нужна упаковка",
    partial: "часть товара упакована",
    unknown: "нужна проверка образца",
  };
  const sizeLabels = {
    small: "мелкий, до 30 см",
    medium: "средний, 30–60 см",
    large: "крупный, больше 60 см",
    mixed: "разные габариты",
  };
  const serviceLabels = {
    handling: "погрузка и разгрузка",
    receiving: "приёмка и учёт в WMS",
    storage: "адресное хранение",
    picking: "отбор и комплектация",
    labeling: "печать и наклейка этикеток",
    packing: "упаковка товара",
    consolidation: "укладка в короба и на паллету",
    returns: "возвраты и переупаковка",
    delivery: "доставка до маркетплейса",
  };
  const presets = {
    storage: ["handling", "receiving", "storage"],
    fbo: ["handling", "receiving", "storage", "picking", "labeling", "consolidation", "delivery"],
    "fbs-ready": ["handling", "receiving", "storage", "picking", "labeling", "consolidation", "delivery"],
    "fbs-full": ["handling", "receiving", "storage", "picking", "labeling", "packing", "consolidation", "delivery"],
    labeling: ["handling", "receiving", "labeling", "packing", "consolidation"],
  };
  const packagingPresets = {
    storage: "unknown",
    fbo: "unknown",
    "fbs-ready": "ready",
    "fbs-full": "needed",
    labeling: "unknown",
  };

  const scenario = form.querySelector('[data-request-input="scenario"]');
  const requestPhone = String(form.dataset.requestPhone || "").replace(/\D/g, "");
  const preview = form.querySelector("[data-request-preview]");
  const whatsapp = form.querySelector("[data-request-whatsapp]");
  const copyButton = form.querySelector("[data-request-copy]");
  const serviceInputs = [...form.querySelectorAll("[data-service-option]")];

  const valueOf = (name) => String(form.elements[name]?.value || "").trim();
  const positiveInteger = (name) => {
    const value = Number(valueOf(name));
    return Number.isInteger(value) && value > 0 ? value : null;
  };

  const buildMessage = () => {
    const parts = [
      `Заявка «МЕСТО ЕСТЬ». Сценарий: ${scenarioLabels[valueOf("scenario")] || valueOf("scenario")}.`,
      `Площадка: ${marketplaceLabels[valueOf("marketplace")] || valueOf("marketplace")}.`,
    ];
    const pallets = positiveInteger("pallets");
    const units = positiveInteger("units");
    const sku = positiveInteger("sku");
    if (pallets) parts.push(`На старте: ${pallets} паллет.`);
    if (units) parts.push(`Объём: около ${units.toLocaleString("ru-RU")} единиц в месяц.`);
    if (sku) parts.push(`Ассортимент: ${sku} SKU.`);
    parts.push(`Упаковка: ${packagingLabels[valueOf("packaging")] || valueOf("packaging")}.`);
    parts.push(`Габарит: ${sizeLabels[valueOf("size")] || valueOf("size")}.`);
    const selectedServices = serviceInputs.filter((input) => input.checked).map((input) => serviceLabels[input.value]);
    if (selectedServices.length) parts.push(`Нужные операции: ${selectedServices.join(", ")}.`);
    parts.push("Прошу подтвердить возможность, сроки и стоимость до заезда.");
    return parts.join(" ");
  };

  const render = () => {
    const message = buildMessage();
    preview.textContent = message;
    whatsapp.href = `https://wa.me/${requestPhone}?text=${encodeURIComponent(message)}`;
  };

  const applyPreset = () => {
    const selected = new Set(presets[scenario.value] || []);
    serviceInputs.forEach((input) => { input.checked = selected.has(input.value); });
    form.elements.packaging.value = packagingPresets[scenario.value] || "unknown";
    render();
    window.mestoestTrack?.("quote_scenario_change", { scenario: scenario.value });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
  };

  form.addEventListener("submit", (event) => event.preventDefault());
  form.querySelectorAll("[data-request-input], [data-service-option]").forEach((input) => {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  });
  scenario.addEventListener("change", applyPreset);
  whatsapp.addEventListener("click", () => {
    window.mestoestTrack?.("quote_complete", { scenario: scenario.value });
    window.mestoestTrack?.("quote_whatsapp", { scenario: scenario.value });
  });
  copyButton.addEventListener("click", async () => {
    await copyText(buildMessage());
    copyButton.textContent = "Заявка скопирована ✓";
    window.mestoestTrack?.("quote_copy", { scenario: scenario.value });
    window.mestoestTrack?.("quote_complete", { scenario: scenario.value });
    window.setTimeout(() => { copyButton.textContent = "Скопировать"; }, 2200);
  });

  applyPreset();
})();
