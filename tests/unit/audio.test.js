import { test } from "node:test";
import assert from "node:assert/strict";
import { createAudioSystem } from "../../src/audio.js";

function makeFakeBackend() {
  const calls = [];
  const elements = new Map();
  return {
    calls,
    elements,
    create(src) {
      const el = {
        src,
        playing: false,
        currentTime: 0,
        play: () => {
          el.playing = true;
          calls.push({ op: "play", src });
          return Promise.resolve();
        },
        pause: () => {
          el.playing = false;
          calls.push({ op: "pause", src });
        }
      };
      elements.set(src, el);
      return el;
    }
  };
}

function makeClock(initial = 0) {
  let now = initial;
  return {
    now: () => now,
    advance: (ms) => {
      now += ms;
    }
  };
}

test("play() plays a clip via the backend", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  assert.deepEqual(backend.calls, [{ op: "play", src: "voice/lion.mp3" }]);
});

test("rapid same-source play() within cooldown is ignored", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(500);
  await audio.play("voice/lion.mp3");
  assert.equal(backend.calls.filter((c) => c.op === "play").length, 1);
});

test("same-source play() after cooldown plays again", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(2000);
  await audio.play("voice/lion.mp3");
  assert.equal(backend.calls.filter((c) => c.op === "play").length, 2);
});

test("different-source play() interrupts current clip", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(300);
  await audio.play("voice/zebra.mp3");
  const playOps = backend.calls.filter((c) => c.op === "play").map((c) => c.src);
  const pauseOps = backend.calls.filter((c) => c.op === "pause").map((c) => c.src);
  assert.deepEqual(playOps, ["voice/lion.mp3", "voice/zebra.mp3"]);
  assert.deepEqual(pauseOps, ["voice/lion.mp3"]);
});

test("playSequence() queues two clips with a gap", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.playSequence(["voice/lion.mp3", "sounds/lion-roar.mp3"]);
  const playSrcs = backend.calls.filter((c) => c.op === "play").map((c) => c.src);
  assert.deepEqual(playSrcs, ["voice/lion.mp3", "sounds/lion-roar.mp3"]);
});
