import { ROSTER } from "./roster.js";

const IDLE_HINT_DELAY_MS = 2000;
const HINT_PAUSE_AFTER_TAP_MS = 4000;
const HINT_INTERVAL_MS = 1500;
const HELLO_WAVE_DELAY_MS = 60_000;

export function renderDiorama(container, { onTap } = {}) {
  container.innerHTML = "";
  const animalEls = new Map();

  for (const animal of ROSTER) {
    const el = document.createElement("button");
    el.className = "animal";
    el.dataset.id = animal.id;
    el.setAttribute("aria-label", animal.englishWord);
    el.style.left = `${animal.position.left}%`;
    el.style.bottom = `${animal.position.bottom}%`;
    el.style.setProperty("--scale", String(animal.scale));
    el.style.transform = `translateX(-50%) scale(${animal.scale})`;
    el.style.zIndex = String(animal.zIndex);

    const img = document.createElement("img");
    img.src = `assets/images/${animal.id}.png`;
    img.alt = "";
    el.appendChild(img);

    const handle = (event) => {
      event.preventDefault();
      triggerTap(el, animal, container);
      idle.notifyTap();
      if (onTap) onTap(animal);
    };
    el.addEventListener("touchstart", handle, { passive: false });
    el.addEventListener("click", handle);

    container.appendChild(el);
    animalEls.set(animal.id, el);
  }

  const idle = createIdleScheduler(animalEls);
  idle.start();
  return container;
}

function triggerTap(el, animal, container) {
  el.classList.remove("tapped");
  void el.offsetWidth;
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1800);
}

function createIdleScheduler(animalEls) {
  const ids = [...animalEls.keys()];
  let cursor = 0;
  let pulseTimer = null;
  let helloTimer = null;
  let lastInteractionAt = performance.now();

  function pulseNext() {
    const id = ids[cursor % ids.length];
    cursor += 1;
    const el = animalEls.get(id);
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
        const id = ids[Math.floor(Math.random() * ids.length)];
        const el = animalEls.get(id);
        el.classList.remove("hello-wave");
        void el.offsetWidth;
        el.classList.add("hello-wave");
        setTimeout(() => el.classList.remove("hello-wave"), 1500);
      }
      scheduleHello();
    }, HELLO_WAVE_DELAY_MS);
  }

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
