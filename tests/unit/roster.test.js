import { test } from "node:test";
import assert from "node:assert/strict";
import { ROSTER, SCENES } from "../../src/roster.js";

test("SCENES exports the two scene IDs in display order", () => {
  assert.deepEqual(SCENES, ["jungle", "backyard"]);
});

test("ROSTER exports an array of 5 entries (jungle scene only, after Task 1)", () => {
  assert.ok(Array.isArray(ROSTER));
  assert.equal(ROSTER.length, 5);
});

test("each entry has the required v1 shape", () => {
  for (const entry of ROSTER) {
    assert.equal(typeof entry.id, "string", `id missing on ${JSON.stringify(entry)}`);
    assert.equal(typeof entry.englishWord, "string");
    assert.equal(typeof entry.voicePath, "string");
    assert.equal(typeof entry.soundPath, "string");
    assert.ok(entry.voicePath.endsWith(".mp3"));
    assert.ok(entry.soundPath.endsWith(".mp3"));
    assert.equal(typeof entry.position, "object");
    assert.equal(typeof entry.position.left, "number");
    assert.equal(typeof entry.position.bottom, "number");
    assert.equal(typeof entry.scale, "number");
    assert.equal(typeof entry.zIndex, "number");
  }
});

test("each entry declares its scene as 'jungle' or 'backyard'", () => {
  for (const entry of ROSTER) {
    assert.ok(["jungle", "backyard"].includes(entry.scene), `bad scene on ${entry.id}: ${entry.scene}`);
  }
});

test("entry IDs are unique", () => {
  const ids = ROSTER.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("v1 jungle animals are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "jungle").map((e) => e.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "zebra"]);
});

test("positions are within 0-100% range", () => {
  for (const entry of ROSTER) {
    assert.ok(entry.position.left >= 0 && entry.position.left <= 100);
    assert.ok(entry.position.bottom >= 0 && entry.position.bottom <= 100);
  }
});
