# Add Egyptian recipes without changing the live catalog

This is a **repository-based editorial workflow**, not an admin dashboard.
It has no public write endpoint and never connects to a database. Only trusted
repository operators should run approval/release commands. A reviewer alias is
an audit label, **not authenticated proof of identity**. If an online editor is
added later, it must use the app's existing Clerk sessions and explicit
server-side editor permissions, not a second login or a public approval API.

## What stays protected

- Existing launch IDs (`mahshi`, `molokhia`, `koshari`) cannot be edited or reused.
- Every subsequent prepared release retains earlier recipe IDs and content.
- No command deletes recipes, modifies user workspaces, changes saved plans,
  installs assets into the app, imports a database, or publishes a deployment.
- Import SQL is additive, transactional and idempotent. An existing same-ID row
  with different content aborts the import instead of replacing it.
- The three cleared launch photos and their attribution remain intact.
- Sample cooks, courses and vouchers never enter a recipe-only release.

Use this workflow for **new dishes**. Updates to existing recipes need a
separately reviewed update policy; changing a slug is not an update mechanism.

## 1. Create and edit a draft

From the workspace root, replace `basbousa` below with a new stable ID:

```sh
pnpm --filter @workspace/api-server run catalog:editor -- create basbousa
```

This creates `catalog/drafts/basbousa.json` under the API package. It is
intentionally incomplete and cannot pass validation or be released. Edit that
JSON in the project file editor. No invented recipe or permission is supplied.

Fill in:

- A clear Egyptian dish title, subtitle, description and category.
- Cooking minutes (1–2880), servings (1–20), per-serving calories (0–5000)
  and difficulty (`Easy`, `Medium`, `Advanced`).
- 1–60 ingredients, each with a nonempty name, a **positive finite quantity**
  and a unit. Combine duplicate name/unit lines.
- 1–40 detailed cooking steps, with integer timers from 0–86400 seconds.
- Egyptian dish context, original instruction source or reuse permission,
  allergens, food-safety notes and the basis for the nutrition estimate.

Validation checks structure and safe bounds. It does **not** establish that a
dish was trial-cooked, that a calorie estimate is scientifically accurate, or
that a recipe is medically appropriate. Record honest estimates and arrange
the separate cooking/nutrition review before making stronger claims.

## 2. Stage a real, dish-matched photograph and document reuse rights

Keep unapproved assets **outside the app's public directory**:

```text
artifacts/api-server/catalog/
  drafts/basbousa.json
  photos/basbousa.jpg
  rights/basbousa.md
```

Use an actual photograph of the named dish, not an illustration, a different
Egyptian dish, or a photo with unproven permission. The extension can be `.jpg`,
`.png` or `.webp`, with matching image bytes and a maximum size of 5 MB.
`recipe.image` must be `/images/food-hub/basbousa.jpg` (or the chosen extension).
The filename must match the stable recipe ID.

Fill in all `photo` fields:

- `file`: staged filename only.
- `title`, `creator`, `sourceUrl`: correct work title, complete creator credit,
  and a durable public HTTPS source without query parameters. Do not use private or signed URLs.
- `license`: `CC0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-SA-3.0`, `owned` or
  `permission`. Unknown and non-commercial-only licenses are blocked.
- `licenseUrl`: the exact official CC URL for CC licenses. For owned/permission
  photos it may be empty, or point to public permission terms.
- `changes`: resizing, cropping and other adaptations (or explicitly none).
- `dishMatch`: a specific explanation of visible ingredients/preparation that
  match this dish. A human must visually confirm it in the preview.
- `evidenceFile`: filename of a `.md`/`.txt` rights record inside `catalog/rights`.
- `sha256`: SHA-256 of the exact staged photo bytes. Obtain it with:

```sh
sha256sum artifacts/api-server/catalog/photos/basbousa.jpg
```

The rights record must explain commercial reuse permission, attribution,
adaptation/ShareAlike obligations, and the public source of the permission.
For `owned`, record who owns the photograph and authorization to publish it.
For `permission`, record the permission scope and an evidence reference.
Do not commit private contracts, identity documents, credentials, signed URLs,
or unnecessary personal data. Obtain any private evidence through a separately
authorized process; store only a non-sensitive reference here.

The tool checks metadata, file boundaries, file types, license consistency and
hashes. It cannot verify ownership, visually recognize food or replace legal
review. The operator must confirm the photo actually shows the dish and that
the documented rights are sufficient.

## 3. Validate and preview

```sh
pnpm --filter @workspace/api-server run catalog:editor -- validate basbousa
pnpm --filter @workspace/api-server run catalog:editor -- preview basbousa
```

Fix every validation error before proceeding. The preview is generated under:

```text
generated-artifacts/food-catalog-editor/reviews/basbousa/preview.html
```

Open that HTML file to review the full recipe, actual embedded photo, timing,
allergens, nutrition basis, source/credit/license, and stable recipe ID. It
works offline, contains no executable JavaScript, is labelled **DRAFT — NOT
PUBLISHED**, and is excluded from Git/deployment output.

Review the associated `catalog/rights/basbousa.md` evidence too.
The fingerprint shown in the preview binds the recipe, the exact photo bytes,
photo metadata and the rights evidence. Recipe/photo/evidence changes invalidate
the preview; regenerate and review it again.

## 4. Explicitly approve the exact reviewed draft

Use the fingerprint from the preview and a non-sensitive reviewer alias:

```sh
pnpm --filter @workspace/api-server run catalog:editor -- approve basbousa \
  --reviewed-sha EXACT_FINGERPRINT_FROM_PREVIEW \
  --reviewer editorial-reviewer \
  --confirm-recipe --confirm-rights
```

These flags attest that you reviewed the instructions and visually matched the
actual photo to the dish, inspected the rights evidence, and accepted the
commercial-use/attribution obligations. Do not run approval automatically in
CI or as part of a build, and do not approve a draft solely because validation
passed.

Approval is recorded in `catalog/approvals/basbousa.json`. Commit the draft,
photo, rights evidence and approval together for review. Repeat approval of the
same unchanged record by the same reviewer is idempotent; silently overwriting
an approval is not allowed.

**Corrections before a release has been prepared:** retain the withdrawn
approval in version history (or move it into a clearly named archive outside
`catalog/approvals`), record the withdrawal reason in the change review, edit
the draft, then generate a fresh preview and approve its new fingerprint.
Do not remove prepared-release history. Once included in a prepared release,
recipe changes are intentionally blocked; a future explicit update workflow
must handle them.

## 5. Explicitly prepare an approved additive release

```sh
pnpm --filter @workspace/api-server run catalog:editor -- release \
  --reviewer release-reviewer --confirm-approved-release
```

The command revalidates **every approved addition**, not every unapproved draft,
and checks all retained prepared-release history. Stale/missing approval,
changed image/evidence or removal/renaming of a previous recipe blocks release.
No automatically approved new dishes are shipped with this workflow.

It creates a fingerprinted package under:

```text
generated-artifacts/food-catalog-editor/releases/RELEASE_FINGERPRINT/
  recipes.json
  release.json
  approvals.json
  import.sql
  verify.sql
  public/photo-credits.html
  public/images/food-hub/...
```

It also creates a small durable receipt under `catalog/prepared-releases/`.
Commit that receipt with the editorial change. It says **prepared, not
published**; it is not a record of an actual production import.

The package contains the unchanged three launch recipes plus all approved
additions, and all matched/licensed assets and credits. Review the package and
its fingerprint. Deliberately copy the package's `public` contents into the
app's `artifacts/food-hub/public` directory as part of the reviewed release.
The tool does **not** install or publish them automatically.

Follow [CATALOG-LAUNCH.md](CATALOG-LAUNCH.md) to select the target database,
manually import the exact reviewed SQL using an authorized client, and verify
the public release. Obtain the actual published origin from deployment
metadata; never guess it from workspace variables. Pass the fingerprinted
package directory to the existing verifier:

```sh
pnpm --filter @workspace/api-server run catalog:verify -- \
  https://YOUR-ACTUAL-PUBLISHED-ORIGIN \
  ../../generated-artifacts/food-catalog-editor/releases/RELEASE_FINGERPRINT
```

The verifier checks the complete reviewed catalog, every original and added
photo's bytes, approved credit-page bytes and review fingerprints. Missing,
additional or changed content fails closed. Production remains unapproved until
the published check and production read-only query both pass.

## Local checks

```sh
pnpm --filter @workspace/api-server run test:editor
pnpm --filter @workspace/api-server run test:catalog
pnpm --filter @workspace/api-server run typecheck
```

Tests use temporary synthetic fixtures and never approve or import a real new
recipe. Database conflict rehearsal should use an isolated, rolled-back
development transaction, never a production write.
