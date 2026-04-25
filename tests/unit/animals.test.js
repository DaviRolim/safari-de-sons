import { test } from "node:test";
import assert from "node:assert/strict";
import { ANIMALS } from "../../src/animals.js";

test("ANIMALS exports an array of 5 animals", () => {
  assert.ok(Array.isArray(ANIMALS));
  assert.equal(ANIMALS.length, 5);
});

test("each animal has the required shape", () => {
  for (const animal of ANIMALS) {
    assert.equal(typeof animal.id, "string", `id missing on ${JSON.stringify(animal)}`);
    assert.equal(typeof animal.englishWord, "string");
    assert.equal(typeof animal.voicePath, "string");
    assert.equal(typeof animal.soundPath, "string");
    assert.ok(animal.voicePath.endsWith(".mp3"));
    assert.ok(animal.soundPath.endsWith(".mp3"));
    assert.equal(typeof animal.position, "object");
    assert.equal(typeof animal.position.left, "number");
    assert.equal(typeof animal.position.bottom, "number");
    assert.equal(typeof animal.scale, "number");
    assert.equal(typeof animal.zIndex, "number");
  }
});

test("animal IDs are unique", () => {
  const ids = ANIMALS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("expected 5 animals are present", () => {
  const ids = ANIMALS.map((a) => a.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "zebra"]);
});

test("positions are within 0-100% range", () => {
  for (const animal of ANIMALS) {
    assert.ok(animal.position.left >= 0 && animal.position.left <= 100);
    assert.ok(animal.position.bottom >= 0 && animal.position.bottom <= 100);
  }
});
