import { ROSTER, SCENES } from "./roster.js";

const IDLE_HINT_DELAY_MS = 2000;
const HINT_PAUSE_AFTER_TAP_MS = 4000;
const HINT_INTERVAL_MS = 1500;
const HELLO_WAVE_DELAY_MS = 60_000;

export function renderDiorama(track, { onTap, scenes } = {}) {
  // track: the .scenes-track element. Each .scene-panel inside is populated here.
  const animalEls = new Map(); // id → button element

  for (const sceneId of SCENES) {
    const panel = track.querySelector(`.scene-panel[data-scene="${sceneId}"]`);
    if (!panel) {
      throw new Error(`renderDiorama: missing panel for scene "${sceneId}"`);
    }
    panel.innerHTML = "";

    const entries = ROSTER.filter((e) => e.scene === sceneId);
    for (const entry of entries) {
      const el = document.createElement("button");
      el.className = "animal";
      el.dataset.id = entry.id;
      el.dataset.scene = sceneId;
      el.setAttribute("aria-label", entry.englishWord);
      el.style.left = `${entry.position.left}%`;
      el.style.bottom = `${entry.position.bottom}%`;
      el.style.setProperty("--scale", String(entry.scale));
      el.style.transform = `translateX(-50%) scale(${entry.scale})`;
      el.style.zIndex = String(entry.zIndex);

      const img = document.createElement("img");
      img.src = entry.spritePath ?? `assets/images/${entry.id}.png`;
      img.alt = "";
      el.appendChild(img);

      const handle = (event) => {
        event.preventDefault();
        triggerTap(el, entry, panel);
        idle.notifyTap();
        if (onTap) onTap(entry);
      };
      el.addEventListener("touchstart", handle, { passive: false });
      el.addEventListener("click", handle);

      panel.appendChild(el);
      animalEls.set(entry.id, el);
    }
  }

  const idle = createIdleScheduler(animalEls, scenes);
  idle.start();
  return track;
}

function triggerTap(el, entry, panel) {
  el.classList.remove("tapped");
  void el.offsetWidth;
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - panelRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - panelRect.top + rect.height / 2}px`;
  panel.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1800);
}

function createIdleScheduler(animalEls, scenes) {
  let cursor = 0;
  let pulseTimer = null;
  let helloTimer = null;
  let lastInteractionAt = performance.now();

  function visibleIds() {
    const sceneId = scenes?.getCurrent?.() ?? null;
    if (!sceneId) return [...animalEls.keys()];
    return ROSTER.filter((e) => e.scene === sceneId).map((e) => e.id);
  }

  function pulseNext() {
    const ids = visibleIds();
    if (ids.length === 0) return;
    const id = ids[cursor % ids.length];
    cursor += 1;
    const el = animalEls.get(id);
    if (!el) return;
    el.classList.remove("pulse-hint");
    void el.offsetWidth;
    el.classList.add("pulse-hint");
    setTimeout(() => el.classList.remove("pulse-hint"), 1500);
  }

  function schedulePulse() {
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      pulseNext();
      pulseTimer = setTimeout(loop, HINT_INTERVAL_MS);
    }, IDLE_HINT_DELAY_MS);
  }

  function loop() {
    pulseNext();
    pulseTimer = setTimeout(loop, HINT_INTERVAL_MS);
  }

  function scheduleHello() {
    clearTimeout(helloTimer);
    helloTimer = setTimeout(() => {
      const idleMs = performance.now() - lastInteractionAt;
      if (idleMs >= HELLO_WAVE_DELAY_MS) {
        const ids = visibleIds();
        if (ids.length > 0) {
          const id = ids[Math.floor(Math.random() * ids.length)];
          const el = animalEls.get(id);
          if (el) {
            el.classList.remove("hello-wave");
            void el.offsetWidth;
            el.classList.add("hello-wave");
            setTimeout(() => el.classList.remove("hello-wave"), 1500);
          }
        }
      }
      scheduleHello();
    }, HELLO_WAVE_DELAY_MS);
  }

  // Reset cursor + restart pulse when scene changes.
  scenes?.onChange?.(() => {
    cursor = 0;
    clearTimeout(pulseTimer);
    schedulePulse();
  });

  return {
    start() {
      schedulePulse();
      scheduleHello();
    },
    notifyTap() {
      lastInteractionAt = performance.now();
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(loop, HINT_PAUSE_AFTER_TAP_MS);
    }
  };
}
