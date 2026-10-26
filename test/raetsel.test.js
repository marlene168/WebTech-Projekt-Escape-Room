// Tests für die Rätseltypen (shared/raetsel/). Ausführen mit: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { RAETSELTYPEN } from "../public/shared/raetsel/index.js";

test("Jeder Rätseltyp hat eine Funktion pruefe(eingabe, loesung)", () => {
  for (const [name, typ] of Object.entries(RAETSELTYPEN)) {
    assert.equal(typeof typ.pruefe, "function", `Rätseltyp "${name}" hat kein pruefe()`);
  }
});

test("Zahlenschloss: nur genau die richtige Ziffernfolge als Text stimmt", () => {
  const { pruefe } = RAETSELTYPEN.zahlenschloss;
  assert.equal(pruefe("417", "417"), true);
  assert.equal(pruefe("471", "417"), false);
  assert.equal(pruefe("41", "417"), false);
  assert.equal(pruefe(417, "417"), false);
  assert.equal(pruefe(undefined, "417"), false);
});

test("Tastenfolge: nur genau dieselbe Folge der Tasten-IDs als Text stimmt", () => {
  const { pruefe } = RAETSELTYPEN.tastenfolge;
  assert.equal(pruefe("a-b-a", "a-b-a"), true);
  assert.equal(pruefe("a-a-b", "a-b-a"), false);
  assert.equal(pruefe("a-b", "a-b-a"), false);
  assert.equal(pruefe(["a", "b", "a"], "a-b-a"), false);
  assert.equal(pruefe(undefined, "a-b-a"), false);
});
