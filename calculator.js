
(() => {
  const panel = document.querySelector('.calculator-panel');
  if (!panel) return;

  const countInput = panel.querySelector('[data-calculator-input="count"]');
  const daysInput = panel.querySelector('[data-calculator-input="days"]');
  const countHint = panel.querySelector('#count-hint');
  const daysHint = panel.querySelector('#days-hint');
  const radios = panel.querySelectorAll('input[name="pallet-type"]');
  const floorLine = panel.querySelector('.calculation-floor');
  const tariffPanel = panel.querySelector('.calculator-tariff');
  const copyButton = panel.querySelector('.calculator-button');
  const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const tiers = [{"label":"1–10","max":10,"euro":54,"american":92},{"label":"11–25","max":25,"euro":50,"american":85},{"label":"26–50","max":50,"euro":46,"american":78},{"label":"51–90","max":90,"euro":42,"american":71},{"label":"91–150","max":150,"euro":38,"american":65},{"label":"от 151","max":null,"euro":34,"american":58}];
  const pricing = {"shortTermMaxDays":29,"shortTermRateMultiplier":3,"longTermHandlingPerMove":175,"shortTermHandlingPerMove":250};

  const normalizeInteger = (value, minimum, maximum = Number.MAX_SAFE_INTEGER) => {
    const parsed = Number(value);
    const finite = Number.isFinite(parsed) ? Math.trunc(parsed) : minimum;
    return Math.min(maximum, Math.max(minimum, finite));
  };

  const calculate = () => {
    const rawCount = Number(countInput.value);
    const rawDays = Number(daysInput.value);
    const count = normalizeInteger(countInput.value, 1, 1000);
    const days = normalizeInteger(daysInput.value, 1);
    const countAdjusted = !Number.isInteger(rawCount) || rawCount < 1 || rawCount > 1000;
    const daysAdjusted = !Number.isInteger(rawDays) || rawDays < 1;
    const isShortTerm = days <= pricing.shortTermMaxDays;
    const rateMultiplier = isShortTerm ? pricing.shortTermRateMultiplier : 1;
    const handlingPerMove = isShortTerm ? pricing.shortTermHandlingPerMove : pricing.longTermHandlingPerMove;
    const type = panel.querySelector('input[name="pallet-type"]:checked')?.value === 'american' ? 'american' : 'euro';
    const tierIndex = tiers.findIndex((item) => item.max === null || count <= item.max);
    const resolvedTierIndex = tierIndex >= 0 ? tierIndex : tiers.length - 1;
    const tier = tiers[resolvedTierIndex];
    const rate = tier[type] * rateMultiplier;
    const rawStorage = count * days * rate;
    const previousTier = resolvedTierIndex > 0 ? tiers[resolvedTierIndex - 1] : null;
    const minimumStorage = previousTier?.max ? previousTier.max * days * previousTier[type] * rateMultiplier : 0;
    const storage = Math.max(rawStorage, minimumStorage);
    const minimumApplied = storage > rawStorage;
    const handling = count * handlingPerMove * 2;
    const tariffLabel = isShortTerm ? 'Краткосрочное хранение' : 'Хранение от 30 суток';

    countInput.setAttribute('aria-invalid', String(countAdjusted));
    daysInput.setAttribute('aria-invalid', String(daysAdjusted));
    countHint.classList.toggle('field-error', countAdjusted);
    daysHint.classList.toggle('field-error', daysAdjusted);
    countHint.textContent = countAdjusted ? 'Для онлайн-расчёта допустимо от 1 до 1 000; расчёт использует ' + count + '.' : 'От 1 до 1 000 паллет в предварительном расчёте.';
    daysHint.textContent = daysAdjusted
      ? 'Минимум 1 сутки; расчёт использует ' + days + '.'
      : isShortTerm
        ? 'Гибкий краткосрочный тариф — от 1 до 29 суток.'
        : 'Выгодный основной тариф — от 30 суток.';
    tariffPanel.classList.toggle('is-short', isShortTerm);
    tariffPanel.classList.toggle('is-long', !isShortTerm);
    panel.querySelector('[data-result="tariff-kicker"]').textContent = isShortTerm ? 'Гибкий срок' : 'Плановое хранение';
    panel.querySelector('[data-result="tariff"]').textContent = tariffLabel;
    panel.querySelector('[data-result="tariff-note"]').textContent = isShortTerm
      ? 'Оплата фактического срока без обязательства хранить 30 дней'
      : 'Более выгодная ставка для запаса на 30 суток и дольше';
    panel.querySelector('[data-result="rate"]').textContent = rate + ' ₽ / сутки';
    panel.querySelector('[data-result="storage-detail"]').textContent = count + ' паллет × ' + days + ' суток';
    panel.querySelector('[data-result="storage"]').textContent = money.format(storage) + ' ₽';
    panel.querySelector('[data-result="minimum"]').textContent = money.format(minimumStorage) + ' ₽';
    panel.querySelector('[data-result="handling"]').textContent = money.format(handling) + ' ₽';
    panel.querySelector('[data-result="handling-detail"]').textContent = 'Разгрузка + загрузка: по ' + money.format(handlingPerMove) + ' ₽ за каждую паллету и каждую операцию';
    panel.querySelector('[data-result="total"]').textContent = money.format(storage + handling) + ' ₽';
    floorLine.classList.toggle('is-hidden', !minimumApplied);
    panel.querySelectorAll('.pallet-type-toggle label').forEach((label, index) => {
      label.classList.toggle('selected', index === (type === 'euro' ? 0 : 1));
    });
    return { count, days, type, storage, minimumApplied, handlingPerMove, handling, tariffLabel, total: storage + handling };
  };

  [countInput, daysInput, ...radios].forEach((input) => input.addEventListener('input', calculate));
  [...radios].forEach((input) => input.addEventListener('change', calculate));
  countInput.addEventListener('blur', () => { countInput.value = String(calculate().count); calculate(); });
  daysInput.addEventListener('blur', () => { daysInput.value = String(calculate().days); calculate(); });

  copyButton.addEventListener('click', async () => {
    const result = calculate();
    const pallet = result.type === 'euro' ? 'европаллет' : 'американских паллет';
    const minimumNote = result.minimumApplied ? ' Применён минимум стоимости предыдущей объёмной ступени.' : '';
    const text = 'Заявка «МЕСТО ЕСТЬ»: ' + result.count + ' ' + pallet + ', ' + result.days + ' суток. Тариф: ' + result.tariffLabel + '. Хранение: ' + money.format(result.storage) + ' ₽.' + minimumNote + ' ПРР по ' + money.format(result.handlingPerMove) + ' ₽ за паллету за операцию, полный цикл: ' + money.format(result.handling) + ' ₽. Предварительно всего: ' + money.format(result.total) + ' ₽. Нужен финальный расчёт дополнительных операций.';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    copyButton.textContent = 'Расчёт скопирован ✓';
    window.mestoestTrack?.('storage_calculator_copy', { pallet_type: result.type, days: result.days });
    window.mestoestTrack?.('storage_calculator_complete', { pallet_type: result.type, days: result.days });
    window.setTimeout(() => { copyButton.textContent = 'Скопировать расчёт'; }, 2200);
  });

  calculate();
})();
