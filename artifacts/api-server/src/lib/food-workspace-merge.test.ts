import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeGuestData } from "./food-workspace-merge";

const empty = () => ({ nickname: "Home cook", savedRecipeIds: [], plan: [], groceries: [], basket: [], voucher: "", courseProgress: [] });
const meal = (id: string, recipeId = "koshari") => ({ id, recipeId, date: "2026-11-18", meal: "Dinner" as const, servings: 4 });

test("a new account keeps every guest workspace section", () => {
  const guest = {
    ...empty(), nickname: "Guest cook", savedRecipeIds: ["koshari"],
    plan: [meal("guest-meal")],
    groceries: [{ id: "g1", name: "Rice", quantity: 2, unit: "cups", checked: false }],
    basket: [{ id: "b1", kind: "grocery" as const, referenceId: "rice", quantity: 2 }],
    courseProgress: [{ courseId: "course", completed: [0, 1] }], voucher: "COOK",
    cookDraft: { displayName: "Cook", area: "", dishes: "Koshari", rate: 10, hours: 4, format: "online" as const },
  };
  assert.deepEqual(mergeGuestData(empty(), guest), guest);
});

test("existing plans survive and colliding guest IDs are renamed, not overwritten", () => {
  const account = { ...empty(), nickname: "Account", plan: [meal("same", "fattah")], savedRecipeIds: ["fattah"], courseProgress: [{ courseId: "c", completed: [0] }] };
  const guest = { ...empty(), plan: [meal("same")], savedRecipeIds: ["koshari", "fattah"], courseProgress: [{ courseId: "c", completed: [1] }] };
  const merged = mergeGuestData(account, guest);
  assert.equal(merged.plan?.length, 2);
  assert.equal(merged.plan?.[0].id, "same");
  assert.notEqual(merged.plan?.[1].id, "same");
  assert.deepEqual(merged.savedRecipeIds, ["fattah", "koshari"]);
  assert.deepEqual(merged.courseProgress, [{ courseId: "c", completed: [0, 1] }]);
  assert.equal(merged.nickname, "Account");
});

test("ambiguous single values fail without changing either input", () => {
  const account = { ...empty(), voucher: "A" };
  const guest = { ...empty(), voucher: "B" };
  const before = JSON.stringify([account, guest]);
  assert.throws(() => mergeGuestData(account, guest), { name: "GuestImportConflict" });
  assert.equal(JSON.stringify([account, guest]), before);
});

test("oversize combined plans fail instead of truncating", () => {
  const account = { ...empty(), plan: Array.from({ length: 150 }, (_, n) => meal(`a-${n}`)) };
  const guest = { ...empty(), plan: Array.from({ length: 100 }, (_, n) => meal(`b-${n}`)) };
  assert.throws(() => mergeGuestData(account, guest), { name: "GuestImportConflict" });
});

test("identical plans are not duplicated", () => {
  const data = { ...empty(), plan: [meal("same")] };
  assert.equal(mergeGuestData(data, data).plan?.length, 1);
});
