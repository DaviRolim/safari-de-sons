import { test } from "node:test";
import assert from "node:assert/strict";
import { createSceneStateMachine } from "../../src/scenes.js";

test("createSceneStateMachine emits onChange only on transitions", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  const events = [];
  sm.onChange((id) => events.push(id));

  sm.observe("jungle", 0.95);
  sm.observe("backyard", 0.05);
  // initial high-ratio scene wins → emits "jungle"
  assert.deepEqual(events, ["jungle"]);

  // No transition; same scene still dominates
  sm.observe("jungle", 0.85);
  sm.observe("backyard", 0.15);
  assert.deepEqual(events, ["jungle"]);

  // Transition: backyard takes over
  sm.observe("jungle", 0.10);
  sm.observe("backyard", 0.90);
  assert.deepEqual(events, ["jungle", "backyard"]);

  // Same again, no duplicate
  sm.observe("backyard", 0.95);
  assert.deepEqual(events, ["jungle", "backyard"]);
});

test("getCurrent returns the dominant scene", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  sm.observe("jungle", 0.6);
  sm.observe("backyard", 0.4);
  assert.equal(sm.getCurrent(), "jungle");

  sm.observe("jungle", 0.3);
  sm.observe("backyard", 0.7);
  assert.equal(sm.getCurrent(), "backyard");
});

test("getCurrent returns the first sceneId before any observation", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  assert.equal(sm.getCurrent(), "jungle");
});

test("multiple onChange subscribers all fire", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  const a = [];
  const b = [];
  sm.onChange((id) => a.push(id));
  sm.onChange((id) => b.push(id));
  sm.observe("backyard", 0.9);
  sm.observe("jungle", 0.1);
  assert.deepEqual(a, ["backyard"]);
  assert.deepEqual(b, ["backyard"]);
});
