import { renderDiorama } from "./diorama.js";
import { createScenes } from "./scenes.js";
import { ROSTER, SCENES } from "./roster.js";
import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";

const diorama = document.getElementById("diorama");
const track = diorama.querySelector(".scenes-track");

const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock(),
  cooldownMs: 1800
});

const allClips = ROSTER.flatMap((entry) => [entry.voicePath, entry.soundPath]);
audio.preload(allClips);

// .scene-panel elements are created by index.html, so createScenes can find
// them immediately. renderDiorama populates them with animal buttons after.
const scenes = createScenes(track, { sceneIds: SCENES });
renderDiorama(track, {
  scenes,
  onTap: (entry) => {
    // iOS Safari requires audio.play() called synchronously from the user
    // gesture event. The CSS animation already paints first naturally
    // (paint is faster than audio decode), so no setTimeout needed.
    audio.playSequence([entry.voicePath, entry.soundPath]);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW registration failures are silent in dev.
    });
  });
}
