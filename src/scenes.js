// src/scenes.js
//
// Owns the swipe-paged scene navigator: scroll-snap detection via
// IntersectionObserver, page-dot rendering, and a public API for the diorama
// to subscribe to current-scene changes.
//
// The DOM-free state machine (createSceneStateMachine) is exported separately
// so it can be unit-tested without IntersectionObserver.

export function createSceneStateMachine({ sceneIds }) {
  if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
    throw new Error("sceneIds must be a non-empty array");
  }

  const ratios = new Map(sceneIds.map((id) => [id, 0]));
  // null = "no observation has been emitted yet" (sentinel for first-emit detection).
  // getCurrent() returns sceneIds[0] when null, so callers always get a valid id.
  let current = null;
  const subscribers = [];

  function dominantScene() {
    let bestId = sceneIds[0];
    let bestRatio = -1;
    for (const id of sceneIds) {
      const r = ratios.get(id) ?? 0;
      if (r > bestRatio) {
        bestId = id;
        bestRatio = r;
      }
    }
    return bestId;
  }

  return {
    observe(sceneId, ratio) {
      if (!ratios.has(sceneId)) return;
      ratios.set(sceneId, ratio);
      const next = dominantScene();
      if (next !== current) {
        current = next;
        for (const cb of subscribers) cb(current);
      }
    },
    getCurrent() {
      return current ?? sceneIds[0];
    },
    onChange(cb) {
      subscribers.push(cb);
    }
  };
}

export function createScenes(track, { sceneIds }) {
  const sm = createSceneStateMachine({ sceneIds });
  const panelEls = new Map();

  for (const sceneId of sceneIds) {
    const panel = track.querySelector(`.scene-panel[data-scene="${sceneId}"]`);
    if (!panel) {
      throw new Error(`Missing panel for scene "${sceneId}"`);
    }
    panelEls.set(sceneId, panel);
  }

  // Detect current scene via IntersectionObserver against the track itself.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const sceneId = e.target.dataset.scene;
        sm.observe(sceneId, e.intersectionRatio);
      }
    },
    {
      root: track,
      threshold: [0, 0.25, 0.5, 0.75, 1]
    }
  );
  for (const panel of panelEls.values()) io.observe(panel);

  // Page dots (rendered into a sibling of the track, populated by index.html).
  const dotsContainer = document.querySelector(".page-dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (const sceneId of sceneIds) {
      const dot = document.createElement("button");
      dot.className = "page-dot";
      dot.dataset.scene = sceneId;
      dot.setAttribute("aria-label", `Go to ${sceneId} scene`);
      dot.addEventListener("click", () => snapTo(sceneId));
      dotsContainer.appendChild(dot);
    }
    sm.onChange((id) => {
      const dots = dotsContainer.querySelectorAll(".page-dot");
      for (const dot of dots) {
        dot.classList.toggle("active", dot.dataset.scene === id);
      }
    });
    // Initial active state.
    const first = dotsContainer.querySelector(`.page-dot[data-scene="${sm.getCurrent()}"]`);
    if (first) first.classList.add("active");
  }

  function snapTo(sceneId) {
    const panel = panelEls.get(sceneId);
    if (!panel) return;
    panel.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return {
    snapTo,
    getCurrent: sm.getCurrent.bind(sm),
    onChange: sm.onChange.bind(sm)
  };
}
