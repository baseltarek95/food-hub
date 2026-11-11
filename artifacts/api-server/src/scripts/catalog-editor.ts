import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { logger } from "../lib/logger";
import { createDraft, loadDraft, previewDraft, approveDraft, prepareRecipeRelease } from "../lib/catalog-editor-workflow";

function workspaceRoot() {
  let path = process.cwd();
  while (!existsSync(resolve(path, "pnpm-workspace.yaml"))) {
    const parent = dirname(path);
    if (parent === path) throw new Error("Run this command from the Food Hub workspace.");
    path = parent;
  }
  return path;
}
const usage = `Recipe editor (trusted repository operators only; no database access):
  catalog:editor create <new-id>
  catalog:editor validate <id>
  catalog:editor preview <id>
  catalog:editor approve <id> --reviewed-sha <fingerprint> --reviewer <alias> --confirm-recipe --confirm-rights
  catalog:editor release --reviewer <alias> --confirm-approved-release
See CATALOG-EDITOR.md before approving or releasing. No command installs assets or publishes data.`;

try {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const command = args.shift();
  if (!command || command === "help") {
    logger.info(usage);
  } else {
    const root = workspaceRoot();
    const paths = { catalogRoot: resolve(root, "artifacts/api-server/catalog"), publicRoot: resolve(root, "artifacts/food-hub/public"), outputRoot: resolve(root, "generated-artifacts/food-catalog-editor") };
    const id = command === "release" ? undefined : args.shift();
    if (!["create", "validate", "preview", "approve", "release"].includes(command) || (command !== "release" && !id)) throw new Error(usage);
    const flags: Record<string, string | boolean> = {};
    const allowed = command === "approve" ? ["--reviewed-sha", "--reviewer", "--confirm-recipe", "--confirm-rights"]
      : command === "release" ? ["--reviewer", "--confirm-approved-release"] : [];
    while (args.length) {
      const flag = args.shift()!;
      if (!allowed.includes(flag) || flag in flags) throw new Error(`Unknown or duplicate option: ${flag}`);
      if (flag.startsWith("--confirm-")) flags[flag] = true;
      else {
        const value = args.shift();
        if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}.`);
        flags[flag] = value;
      }
    }
    if (command === "create") logger.info({ path: createDraft(paths, id!) }, "Incomplete draft created; nothing published.");
    if (command === "validate") {
      const entry = loadDraft(paths, id!);
      logger.info({ recipeId: id, draftSha256: entry.fingerprint }, "Draft structure, photo hash and evidence validated. Human review is still required.");
    }
    if (command === "preview") logger.info(previewDraft(paths, id!), "Offline draft preview created. Open and review it before approval.");
    if (command === "approve") {
      const a = approveDraft(paths, id!, { reviewedSha: String(flags["--reviewed-sha"] ?? ""), reviewer: String(flags["--reviewer"] ?? ""), confirmRecipe: flags["--confirm-recipe"] === true, confirmRights: flags["--confirm-rights"] === true });
      logger.info({ recipeId: id, draftSha256: a.draftSha256 }, "Exact reviewed draft approved by repository operator; not published.");
    }
    if (command === "release") logger.info(prepareRecipeRelease(paths, { reviewer: String(flags["--reviewer"] ?? ""), confirmRelease: flags["--confirm-approved-release"] === true }), "Approved additive release prepared. Review and install assets, then follow the explicit production import process. No database was accessed.");
  }
} catch (err) {
  logger.error({ message: err instanceof Error ? err.message : "Unknown editor error" }, "Recipe editor stopped; nothing was published.");
  process.exitCode = 1;
}
