import { ANIMALS } from "./animals.js";

export function renderDiorama(container, { onTap } = {}) {
  container.innerHTML = "";
  for (const animal of ANIMALS) {
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
      if (onTap) onTap(animal);
    };
    el.addEventListener("touchstart", handle, { passive: false });
    el.addEventListener("click", handle);

    container.appendChild(el);
  }
  return container;
}

function triggerTap(el, animal, container) {
  el.classList.remove("tapped");
  void el.offsetWidth; // force reflow so the animation restarts
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1300);
}
