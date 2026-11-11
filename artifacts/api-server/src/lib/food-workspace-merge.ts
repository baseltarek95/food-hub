import { randomUUID } from "node:crypto";
import { UpdateFoodWorkspaceBody } from "@workspace/api-zod";

function conflict(message: string): never {
  const error = new Error(`${message} Both workspaces are unchanged. Sign out to review your browser workspace, then resolve the difference and retry.`);
  error.name = "GuestImportConflict";
  throw error;
}

/** Non-destructive union. Ambiguous singleton values and size limits fail closed. */
export function mergeGuestData(accountData: Record<string, unknown>, guestData: Record<string, unknown>) {
  const account = UpdateFoodWorkspaceBody.parse(accountData);
  const guest = UpdateFoodWorkspaceBody.parse(guestData);
  if (account.cookDraft && guest.cookDraft && JSON.stringify(account.cookDraft) !== JSON.stringify(guest.cookDraft)) {
    conflict("Both kitchens have different cook application drafts.");
  }
  if (account.voucher && guest.voucher && account.voucher !== guest.voucher) {
    conflict("Both kitchens have different selected vouchers.");
  }
  const progress = new Map((account.courseProgress ?? []).map((p) => [p.courseId, p.completed]));
  for (const p of guest.courseProgress ?? []) {
    progress.set(p.courseId, [...new Set([...(progress.get(p.courseId) ?? []), ...p.completed])]);
  }
  const mergeRows = <T extends { id: string }>(a: T[] = [], b: T[] = []): T[] => {
    const ids = new Set(a.map((r) => r.id));
    return [...a, ...b.flatMap((r) => {
      if (a.some((old) => JSON.stringify(old) === JSON.stringify(r))) return [];
      const row = ids.has(r.id) ? { ...r, id: randomUUID() } : r;
      ids.add(row.id);
      return [row];
    })];
  };
  const merged = {
    ...guest, ...account,
    nickname: account.nickname && account.nickname !== "Home cook" ? account.nickname : guest.nickname ?? "Home cook",
    savedRecipeIds: [...new Set([...(account.savedRecipeIds ?? []), ...(guest.savedRecipeIds ?? [])])],
    plan: mergeRows(account.plan, guest.plan),
    groceries: mergeRows(account.groceries, guest.groceries),
    basket: mergeRows(account.basket, guest.basket),
    courseProgress: [...progress].map(([courseId, completed]) => ({ courseId, completed })),
    voucher: account.voucher || guest.voucher || "",
    ...(account.cookDraft || guest.cookDraft ? { cookDraft: account.cookDraft ?? guest.cookDraft } : {}),
  };
  const validated = UpdateFoodWorkspaceBody.safeParse(merged);
  if (!validated.success) conflict("Combining these kitchens would exceed a workspace limit.");
  return validated.data!;
}
