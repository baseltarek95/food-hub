# Editorial source files

Start with `pnpm --filter @workspace/api-server run catalog:editor -- create <new-id>`
from the workspace root. See [the editor guide](../CATALOG-EDITOR.md).

- `drafts/`: incomplete or reviewed JSON, never live application data.
- `photos/`: actual staged photographs, not public until explicitly released.
- `rights/`: non-sensitive commercial reuse and attribution evidence.
- `approvals/`: explicit reviewer decisions bound to draft/photo/evidence hashes.
- `prepared-releases/`: append-only receipts protecting already-prepared IDs.

Directories are created on the first command. No new recipes are preapproved.
Keep these small editorial records and necessary source assets in version
control. Generated previews/release packages belong under ignored
`generated-artifacts/`, not here. For large media, arrange durable App Storage
rather than checking large binaries into Git.
