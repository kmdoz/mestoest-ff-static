(() => {
  const root = document.querySelector("main[data-content-revision]");
  if (!root) return;

  const navigationLinks = Array.from(document.querySelectorAll("a[data-nav-target]"));
  const sectionIds = [...new Set(navigationLinks.map((link) => link.dataset.navTarget).filter(Boolean))];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const progress = document.querySelector(".site-scroll-progress");
  const mobileMenu = document.querySelector(".mobile-menu");
  let animationFrame = 0;

  const setActiveSection = (activeId) => {
    navigationLinks.forEach((link) => {
      const active = Boolean(activeId && link.dataset.navTarget === activeId);
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const updateNavigation = () => {
    animationFrame = 0;
    const markerY = Math.min(190, window.innerHeight * 0.28);
    const atStart = window.scrollY < 32;
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let activeId = null;

    if (!atStart) {
      if (atEnd) activeId = sections.at(-1)?.id ?? null;
      else {
        for (const section of sections) {
          if (section.getBoundingClientRect().top > markerY) break;
          activeId = section.id;
        }
      }
    }

    setActiveSection(activeId);
    if (progress) {
      const scrollableHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      progress.value = scrollableHeight === 0
        ? 100
        : Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100));
    }
  };

  const scheduleNavigationUpdate = () => {
    if (animationFrame) return;
    animationFrame = window.requestAnimationFrame(updateNavigation);
  };

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => mobileMenu?.removeAttribute("open"));
  });
  updateNavigation();
  window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavigationUpdate);

  const revealTargets = Array.from(root.querySelectorAll("[data-reveal]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || typeof IntersectionObserver === "undefined") {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const initiallyVisible = revealTargets.filter(
    (target) => target.getBoundingClientRect().top < window.innerHeight * 0.94,
  );
  const initiallyVisibleSet = new Set(initiallyVisible);
  root.classList.add("motion-ready");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      initiallyVisible.forEach((target) => target.classList.add("is-visible"));
    });
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  revealTargets
    .filter((target) => !initiallyVisibleSet.has(target))
    .forEach((target) => revealObserver.observe(target));

  const warehouseVisual = root.querySelector("[data-warehouse-visual]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (warehouseVisual && finePointer) {
    let pointerFrame = 0;
    let pendingPointer = null;
    const applyPointerTilt = () => {
      pointerFrame = 0;
      if (!pendingPointer) return;
      const { clientX, clientY } = pendingPointer;
      pendingPointer = null;
      const rect = warehouseVisual.getBoundingClientRect();
      const horizontal = (clientX - rect.left) / Math.max(1, rect.width);
      const vertical = (clientY - rect.top) / Math.max(1, rect.height);
      const x = horizontal < 0.38 ? "left" : horizontal > 0.62 ? "right" : "center";
      const y = vertical < 0.38 ? "top" : vertical > 0.62 ? "bottom" : "center";
      const nextTilt = `${y}-${x}`;
      if (warehouseVisual.dataset.tilt !== nextTilt) warehouseVisual.dataset.tilt = nextTilt;
    };
    warehouseVisual.addEventListener("pointermove", (event) => {
      pendingPointer = { clientX: event.clientX, clientY: event.clientY };
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(applyPointerTilt);
    }, { passive: true });
    warehouseVisual.addEventListener("pointerleave", () => {
      pendingPointer = null;
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      }
      warehouseVisual.removeAttribute("data-tilt");
    });
  }
})();
