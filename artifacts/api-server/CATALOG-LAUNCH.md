# Food Hub recipe catalog release

## Status — 2026-11-11

Photo rights are documented in `../food-hub/public/images/food-hub/SOURCES.md`.
The release contains the three curated recipes from `src/scripts/seed-food.ts`.
Recipes are Food Hub's curated instructions, not copied from the photograph sources.
Calories are illustrative estimates, not laboratory nutrition claims.

**No published environment exists at the time of preparation. The production catalog has not been imported or verified. This is not approval for public launch.** Do not treat a populated development preview as evidence of production content.

Preparation checks include workspace typecheck, automated release/verifier tests, development HTTP checks of all three recipes and licensed photo bytes, and two consecutive SQL-import rehearsals within one rolled-back development transaction. The SQL read-back reported all three expected rows present and matching; no catalog data was changed. The final launch verifier additionally rejects all extra recipes and sample cooks, courses or vouchers. The development preview intentionally contains sample rows and therefore is not a passing recipe-only launch environment. These checks are development evidence only.

## 1. Export and review, without accessing any database

From the workspace root:

```sh
pnpm --filter @workspace/api-server run catalog:export
```

This writes `generated-artifacts/food-catalog/{recipes.json,release.json,import.sql,verify.sql}` (excluded from Git and deployment output). `release.json` records the recipe IDs and SHA-256 fingerprint of the exported records. Review these files and the photo credits before any import. Re-export and review if the curated data changes.

Only recipes are exported. Sample cooks, sample courses and illustrative vouchers deliberately stay out of the launch import. Existing lesson drafts and guest workspaces are never touched. Real provider/payment setup is a separate task.

## 2. Select the target deliberately

After this work merges, obtain the actual published origin using deployment metadata. Do not guess a production URL from workspace environment variables.

An authorized operator must select the intended **production** database in their database administration workflow before running any data import. Never substitute the workspace's development `DATABASE_URL`, paste connection credentials into chat or source, or run the development seed on production.

For the Replit-managed database, use the normal publishing flow for schema creation/updates. This release adds **no schema migration**, startup DDL, build-time seeding, public import endpoint or automatic production write. If `food_catalog` is missing, stop; resolve schema setup through that supported flow, not by adding DDL to this import.

## 3. Import the reviewed data once, explicitly

Run the reviewed `import.sql` against the selected production database using the operator's authorized SQL client. This is a manual content operation, never part of application startup or deployment commands.

- One transaction imports all recipes or none.
- Matching existing rows are left unchanged; rerunning the identical release is safe.
- Any same-ID row with different content or kind aborts the entire release. Review differences before preparing a separately approved update; this import never silently replaces published edits.
- No deletions, schema changes, sample-provider imports or user-data writes.
- The table lock has a five-second timeout and the import has a thirty-second statement timeout. If blocked, the transaction fails rather than waiting indefinitely. Roll back a failed transaction before retrying.

The production query helper available to the agent is read-only; it cannot execute this write. Do not evade that restriction by connecting the development shell to production.

## 4. Verify the published environment before any launch recommendation

First run `verify.sql` read-only against production. Every expected row in the first result must have `present = true` and `matches = true`. The second result, listing unexpected catalog rows, must be empty. Existing sample/unrelated rows cause a blocked release, not automatic deletion: review them and approve any cleanup separately. Retain the release fingerprint and dated verification result with the release record.

Then, from the workspace root, run with the **actual origin returned by deployment metadata**:

```sh
pnpm --filter @workspace/api-server run catalog:verify -- https://YOUR-PUBLISHED-ORIGIN
```

Use the URL itself in place of the example. The verifier requires the generated release files, reads only public GET endpoints and requires exactly the reviewed recipe IDs and empty cooks, courses and vouchers. It fails on missing/different/additional recipes, development samples, absent photo attribution, wrong photo bytes, redirects, private access gates and unavailable services. It checks `/api/food/catalog`, `/photo-credits.html` and all three licensed JPEGs. Do not weaken privacy to get a passing result; an operator can instead perform equivalent authorized checks and record the evidence.

For development-only rehearsal:

```sh
pnpm --filter @workspace/api-server run catalog:verify -- http://localhost:80 --allow-development
```

This uses the same strict content checks and labels any success **development**, never production approval. It is expected to fail on a development database containing sample instructors, courses or vouchers. Do not delete development samples just to make it pass. The exact-match release verifier may also intentionally fail after legitimate recipe updates; export and review the new intended release before verifying it.

Public launch must stay unapproved until the **published** check and production read-only query pass. A preview screenshot, development seed, successful build or generated SQL file is not proof of a populated production catalog. Passing the content check also does not make sample lessons or other unavailable services live.
