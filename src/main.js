import { renderDiorama } from "./diorama.js";
import { ANIMALS } from "./animals.js";
import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";

const container = document.getElementById("diorama");
const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock(),
  cooldownMs: 1800
});

const allClips = ANIMALS.flatMap((a) => [a.voicePath, a.soundPath]);
audio.preload(allClips);

renderDiorama(container, {
  onTap: (animal) => {
    // iOS Safari requires audio.play() called synchronously from the user
    // gesture event. The CSS animation already paints first naturally
    // (paint is faster than audio decode), so no setTimeout needed.
    audio.playSequence([animal.voicePath, animal.soundPath]);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW registration failures are silent in dev.
    });
  });
}
