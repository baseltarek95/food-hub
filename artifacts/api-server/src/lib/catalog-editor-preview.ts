import type { ValidatedDraft } from "./catalog-editor-validation";

export const escapeHtml = (value: unknown) => String(value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function photoCredit(entry: ValidatedDraft) {
  const p = entry.draft.photo;
  return `<article><h2>${escapeHtml(p.title)}</h2>
<p>Photograph by ${escapeHtml(p.creator)}. <a href="${escapeHtml(p.sourceUrl)}">Source</a>.</p>
<p>License: ${p.licenseUrl ? `<a href="${escapeHtml(p.licenseUrl)}">${escapeHtml(p.license)}</a>` : escapeHtml(p.license)}.</p>
<p>Changes: ${escapeHtml(p.changes)}.</p>
<p>Dish match: ${escapeHtml(p.dishMatch)}</p>
${p.license.includes("BY-SA") ? "<p>The photograph and adaptations remain under the same ShareAlike license; Food Hub code is separate.</p>" : ""}
<p><small>Reuse only under the stated permission and attribution terms. No photographer endorsement is implied.</small></p></article>`;
}

/** Offline review file: no application endpoint, JavaScript or external assets. */
export function renderDraftPreview(entry: ValidatedDraft) {
  const { recipe: r, editorial: e } = entry.draft;
  const h = escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="robots" content="noindex,nofollow"><title>Draft review: ${h(r.title)} | Food Hub</title>
<style>*{box-sizing:border-box}body{margin:0;background:#fbf7ed;color:#25362b;font:16px/1.6 system-ui,sans-serif}main{max-width:920px;margin:auto;padding:24px}h1{line-height:1.2}img{width:100%;max-height:400px;object-fit:contain;border-radius:20px}section,article{padding:20px;background:#fffdf7;border:1px solid #e6e5d9;border-radius:18px;margin:18px 0}.warning{background:#f5e8d1;padding:16px;border-radius:12px}code{overflow-wrap:anywhere}li{margin:8px 0}a{color:#285c43}dt{font-weight:bold}dd{margin:0 0 12px}table{width:100%;text-align:left}td{padding:8px;border-bottom:1px solid #eee}</style>
</head><body><main><p>FOOD HUB · EDITORIAL PREVIEW</p>
<p class="warning"><strong>DRAFT — NOT PUBLISHED.</strong> This file does not change the app or database. Review the complete recipe and actual photo, then use the explicit approval command. Validation is not proof of cooking trials or legal clearance.</p>
<h1>${h(r.title)}</h1><p>${h(r.subtitle)}</p>
<img src="data:${entry.contentType};base64,${entry.photoBytes.toString("base64")}" alt="${h(entry.draft.photo.dishMatch)}">
<p>${h(r.description)}</p><p>${r.minutes} minutes · ${r.servings} servings · ${r.calories} kcal per serving (basis below) · ${h(r.difficulty)} · ${r.vegetarian ? "Vegetarian" : "Not vegetarian"}</p>
<section><h2>Ingredients</h2><table><thead><tr><th>Ingredient</th><th>Quantity</th></tr></thead><tbody>${r.ingredients.map((i) => `<tr><td>${h(i.name)}</td><td>${i.quantity} ${h(i.unit)}</td></tr>`).join("")}</tbody></table></section>
<section><h2>Cooking steps</h2><ol>${r.steps.map((s) => `<li>${h(s.text)}${s.timerSeconds ? ` <strong>Timer: ${s.timerSeconds} seconds</strong>` : ""}</li>`).join("")}</ol></section>
<section><h2>Required editorial review</h2><dl>${Object.entries(e).map(([k, v]) => `<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join("")}</dl></section>
${photoCredit(entry)}
<section><h2>Review record</h2><p>Stable ID: <code>${h(r.id)}</code></p>
<p>Photo SHA-256: <code>${h(entry.draft.photo.sha256)}</code></p>
<p>Rights evidence: ${h(entry.draft.photo.evidenceFile)} · <code>${entry.evidenceSha256}</code></p>
<p>Approve only this exact draft fingerprint:</p><code>${entry.fingerprint}</code></section>
</main></body></html>`;
}
