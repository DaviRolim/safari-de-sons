import { ANIMALS } from "./animals.js";

export function renderDiorama(container) {
  container.innerHTML = "";
  for (const animal of ANIMALS) {
    const el = document.createElement("button");
    el.className = "animal";
    el.dataset.id = animal.id;
    el.setAttribute("aria-label", animal.englishWord);
    el.style.left = `${animal.position.left}%`;
    el.style.bottom = `${animal.position.bottom}%`;
    el.style.transform = `translateX(-50%) scale(${animal.scale})`;
    el.style.zIndex = String(animal.zIndex);

    const img = document.createElement("img");
    img.src = `assets/images/${animal.id}.png`;
    img.alt = "";
    el.appendChild(img);

    container.appendChild(el);
  }
  return container;
}
