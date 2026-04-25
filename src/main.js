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
    // Spec §3.3: voice clip starts at T+150ms (tap animation gets a head start).
    setTimeout(() => {
      audio.playSequence([animal.voicePath, animal.soundPath]);
    }, 150);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW registration failures are silent in dev.
    });
  });
}
