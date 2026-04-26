import { test } from "node:test";
import assert from "node:assert/strict";
import { ROSTER, SCENES } from "../../src/roster.js";

test("SCENES exports the two scene IDs in display order", () => {
  assert.deepEqual(SCENES, ["jungle", "backyard"]);
});

test("ROSTER exports 12 entries — 6 per scene", () => {
  assert.ok(Array.isArray(ROSTER));
  assert.equal(ROSTER.length, 12);
  const jungle = ROSTER.filter((e) => e.scene === "jungle");
  const backyard = ROSTER.filter((e) => e.scene === "backyard");
  assert.equal(jungle.length, 6);
  assert.equal(backyard.length, 6);
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

test("v1 jungle animals (plus jungle Natan) are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "jungle").map((e) => e.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "natan-jungle", "zebra"]);
});

test("backyard animals (plus backyard Natan) are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "backyard").map((e) => e.id).sort();
  assert.deepEqual(ids, ["bird", "cat", "cow", "dog", "natan-backyard", "turtle"]);
});

test("Natan entries declare the br-pt voice override", () => {
  const natanEntries = ROSTER.filter((e) => e.id.startsWith("natan-"));
  assert.equal(natanEntries.length, 2);
  for (const entry of natanEntries) {
    assert.equal(entry.voice, "br-pt");
    assert.equal(entry.englishWord, "Natan");
    assert.ok(entry.spritePath?.endsWith(".png"), `${entry.id} should declare a spritePath`);
  }
});

test("non-Natan entries either omit voice or set voice='british'", () => {
  for (const entry of ROSTER) {
    if (entry.id.startsWith("natan-")) continue;
    if ("voice" in entry) assert.equal(entry.voice, "british");
  }
});

test("positions are within 0-100% range", () => {
  for (const entry of ROSTER) {
    assert.ok(entry.position.left >= 0 && entry.position.left <= 100);
    assert.ok(entry.position.bottom >= 0 && entry.position.bottom <= 100);
  }
});
