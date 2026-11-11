import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { Check, Plus, ShoppingBasket, Sparkles, Trash2, X } from 'lucide-react';
import { PlanEntryMeal, type PlanEntry, type BasketItem } from '@workspace/api-client-react';
import { PageHeader, LoadingState, ErrorState, EmptyState, Unavailable } from '@/components/fh';
import { useFoodData, useSaveWorkspace, usePageMeta, imgSrc, todayISO, prettyDate, uid, aggregatePlan, fmtQty, round2 } from '@/lib/food';

const MEALS = Object.values(PlanEntryMeal);

export default function PlannerPage() {
  usePageMeta('Meal planner', 'Plan dated family meals and generate one combined grocery list.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  const preset = new URLSearchParams(window.location.search).get('recipe') ?? '';
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState<PlanEntryMeal>('Lunch');
  const [recipeId, setRecipeId] = useState(preset);
  const [servings, setServings] = useState('4');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [item, setItem] = useState({ name: '', quantity: '1', unit: '' });
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => todayISO(i)), []);
  const grouped = useMemo(() => {
    const plan = [...(ws?.plan ?? [])].sort((a, b) => a.date.localeCompare(b.date) || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));
    const m = new Map<string, PlanEntry[]>();
    for (const p of plan) m.set(p.date, [...(m.get(p.date) ?? []), p]);
    return Array.from(m.entries());
  }, [ws]);

  if (isLoading) return <LoadingState label="Loading planner" />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;

  const addMeal = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = 'Choose a date.';
    if (!recipeId) errs.recipe = 'Choose a recipe.';
    const s = Number(servings);
    if (!Number.isInteger(s) || s < 1 || s > 20) errs.servings = 'Servings must be a whole number from 1 to 20.';
    if (ws.plan.length >= 200) errs.recipe = 'Your plan is full (200 meals). Remove some first.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await save({ plan: [...ws.plan, { id: uid('p'), date, meal, recipeId, servings: s }] }, 'Meal added to your plan');
    if (ok) setRecipeId('');
  };

  const removeMeal = (id: string) => void save({ plan: ws.plan.filter((p) => p.id !== id) }, 'Meal removed');

  const generate = () => {
    const agg = aggregatePlan(ws.plan, catalog.recipes);
    const checkedKeys = new Set(ws.groceries.filter((g) => g.checked).map((g) => `${g.name.toLowerCase()}|${g.unit.toLowerCase()}`));
    const manual = ws.groceries.filter((g) => g.id.startsWith('m-'));
    const generated = agg.map((i) => ({ id: uid('g'), name: i.name.slice(0, 100), quantity: Math.max(0.01, round2(i.quantity)), unit: i.unit.slice(0, 30), checked: checkedKeys.has(`${i.name.toLowerCase()}|${i.unit.toLowerCase()}`) }));
    void save({ groceries: [...generated, ...manual].slice(0, 300) }, `Grocery list built from ${ws.plan.length} planned meals`);
  };

  const toggleItem = (id: string) => void save({ groceries: ws.groceries.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g)) });
  const removeItem = (id: string) => void save({ groceries: ws.groceries.filter((g) => g.id !== id) }, 'Item removed');
  const clearChecked = () => void save({ groceries: ws.groceries.filter((g) => !g.checked) }, 'Checked items cleared');

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const q = Number(item.quantity);
    if (!item.name.trim()) errs.name = 'Name the item.';
    else if (item.name.trim().length > 100) errs.name = 'Keep the name under 100 characters.';
    if (!(q >= 0.01 && q <= 100000)) errs.quantity = 'Quantity must be between 0.01 and 100000.';
    if (item.unit.length > 30) errs.unit = 'Unit is too long.';
    if (ws.groceries.length >= 300) errs.name = 'Your list is full (300 items).';
    setItemErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await save({ groceries: [...ws.groceries, { id: uid('m'), name: item.name.trim(), quantity: q, unit: item.unit.trim(), checked: false }] }, 'Item added');
    if (ok) setItem({ name: '', quantity: '1', unit: '' });
  };

  const toBasket = () => {
    const unchecked = ws.groceries.filter((g) => !g.checked);
    const existing = new Set(ws.basket.filter((b) => b.kind === 'grocery').map((b) => b.referenceId));
    const add: BasketItem[] = unchecked.filter((g) => !existing.has(g.id)).map((g) => ({ id: uid('b'), kind: 'grocery', referenceId: g.id, quantity: 1 }));
    if (!add.length) return;
    void save({ basket: [...ws.basket, ...add].slice(0, 100) }, `${add.length} grocery lines added to your cart`);
  };

  const checkedCount = ws.groceries.filter((g) => g.checked).length;

  return (
    <div>
      <PageHeader eyebrow="Your meal plan" title="A week that tastes like home" subtitle="Add dated meals, then build one combined grocery list scaled to each meal's servings." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[18px] bg-[#eaf0e4] p-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#597359]">Next 7 days</p><p className="mt-1 text-[15px] font-extrabold">{ws.plan.length} meals planned</p></div>
            <Sparkles size={16} className="text-[#315641]" aria-hidden />
          </div>
          <div className="fh-scroll flex gap-2 overflow-x-auto" role="group" aria-label="Pick a day">
            {days.map((d) => {
              const dt = new Date(`${d}T12:00:00`);
              const n = ws.plan.filter((p) => p.date === d).length;
              return (
                <button key={d} type="button" aria-pressed={date === d} onClick={() => setDate(d)} data-testid={`button-day-${d}`}
                  className={`grid h-14 min-w-12 place-items-center rounded-[14px] px-2 text-[11px] font-bold ${date === d ? 'bg-[#285c43] text-white' : 'bg-[#fffdf7] text-[#526254]'}`}>
                  <span>{dt.toLocaleDateString('en-GB', { weekday: 'short' })} {dt.getDate()}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${n ? (date === d ? 'bg-white' : 'bg-[#db7546]') : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>

          <form onSubmit={addMeal} noValidate className="fh-card grid gap-3 p-4 sm:grid-cols-2" aria-label="Add a meal">
            <label className="fh-label">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="fh-input mt-1.5" aria-invalid={!!errors.date} data-testid="input-plan-date" />{errors.date && <p className="fh-error">{errors.date}</p>}</label>
            <label className="fh-label">Meal<select value={meal} onChange={(e) => setMeal(e.target.value as PlanEntryMeal)} className="fh-input mt-1.5" data-testid="select-plan-meal">{MEALS.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="fh-label">Recipe<select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="fh-input mt-1.5" aria-invalid={!!errors.recipe} data-testid="select-plan-recipe"><option value="">Choose a dish</option>{catalog.recipes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select>{errors.recipe && <p className="fh-error">{errors.recipe}</p>}</label>
            <label className="fh-label">Servings<input type="number" min={1} max={20} value={servings} onChange={(e) => setServings(e.target.value)} className="fh-input mt-1.5" aria-invalid={!!errors.servings} data-testid="input-plan-servings" />{errors.servings && <p className="fh-error">{errors.servings}</p>}</label>
            <button type="submit" disabled={saving} className="fh-btn sm:col-span-2" data-testid="button-add-meal"><Plus size={15} /> {saving ? 'Saving...' : 'Add to plan'}</button>
          </form>

          {grouped.length === 0 ? (
            <EmptyState title="No meals planned yet" body="Pick a day and a dish above. Your plan is saved to this browser's guest workspace." />
          ) : grouped.map(([d, entries]) => (
            <section key={d} aria-label={prettyDate(d)}>
              <h2 className="mb-2 text-[12px] font-extrabold text-[#597359]">{prettyDate(d)}</h2>
              <div className="space-y-2">
                {entries.map((p) => {
                  const r = catalog.recipes.find((x) => x.id === p.recipeId);
                  return (
                    <div key={p.id} className="flex gap-3 rounded-[17px] border border-[#e7e6da] bg-[#fffdf7] p-3" data-testid={`row-plan-${p.id}`}>
                      <img src={imgSrc(r?.image)} alt="" className="h-[68px] w-[78px] rounded-[12px] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="fh-eyebrow">{p.meal}</p>
                        {r ? <Link href={`/recipes/${r.id}`} className="mt-1 block text-[13px] font-extrabold">{r.title}</Link> : <p className="mt-1 text-[13px] font-extrabold">Recipe no longer available</p>}
                        <p className="mt-1 text-[10px] text-[#7f897c]">{p.servings} servings{r ? ` · ${r.minutes} min` : ''}</p>
                      </div>
                      <button type="button" disabled={saving} onClick={() => removeMeal(p.id)} aria-label={`Remove ${r?.title ?? 'meal'} from ${prettyDate(p.date)}`} className="self-center rounded-full p-2 text-[#8a6a52] disabled:opacity-50" data-testid={`button-remove-plan-${p.id}`}><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-8" aria-labelledby="grocery-heading">
          <div className="rounded-[18px] bg-[#f3f0e3] p-4">
            <div className="mb-2 flex items-center justify-between"><h2 id="grocery-heading" className="text-[15px] font-extrabold">Grocery list</h2><span className="text-[10px] text-[#758073]">{checkedCount} of {ws.groceries.length} checked</span></div>
            <button type="button" disabled={saving || ws.plan.length === 0} onClick={generate} className="mb-2 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#285c43] py-2.5 text-[12px] font-extrabold text-white disabled:opacity-50" data-testid="button-generate-groceries">
              <Sparkles size={13} /> Build list from plan
            </button>
            <p className="mb-2 text-[10px] leading-[1.5] text-[#7b8377]">Rebuilding replaces plan-generated lines and keeps items you added by hand.</p>
            {ws.groceries.length === 0 ? <p className="border-t border-[#dfdfd1] py-4 text-center text-[11px] text-[#7b8377]">Your list is empty.</p> : (
              <ul>
                {ws.groceries.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 border-t border-[#dfdfd1] py-2.5" data-testid={`row-grocery-${g.id}`}>
                    <button type="button" role="checkbox" aria-checked={g.checked} disabled={saving} onClick={() => toggleItem(g.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-[12px]">
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${g.checked ? 'border-[#447251] bg-[#447251] text-white' : 'border-[#bdc3b6]'}`}>{g.checked && <Check size={10} />}</span>
                      <span className={`truncate ${g.checked ? 'text-[#90978a] line-through' : ''}`}>{g.name} · {fmtQty(g.quantity, g.unit)}</span>
                    </button>
                    <button type="button" disabled={saving} onClick={() => removeItem(g.id)} aria-label={`Remove ${g.name}`} className="p-1 text-[#8a8f84]"><X size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addItem} noValidate className="mt-3 border-t border-[#dfdfd1] pt-3" aria-label="Add grocery item">
              <div className="grid grid-cols-[1fr_70px_70px] gap-2">
                <input aria-label="Item name" placeholder="Item" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} className="fh-input" aria-invalid={!!itemErrors.name} data-testid="input-grocery-name" />
                <input aria-label="Quantity" type="number" step="any" min={0.01} value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} className="fh-input" aria-invalid={!!itemErrors.quantity} data-testid="input-grocery-qty" />
                <input aria-label="Unit" placeholder="Unit" value={item.unit} onChange={(e) => setItem({ ...item, unit: e.target.value })} className="fh-input" aria-invalid={!!itemErrors.unit} data-testid="input-grocery-unit" />
              </div>
              {Object.values(itemErrors).map((m) => <p key={m} className="fh-error">{m}</p>)}
              <button type="submit" disabled={saving} className="fh-btn-2 mt-2 w-full" data-testid="button-add-grocery"><Plus size={14} /> Add item</button>
            </form>
            {checkedCount > 0 && <button type="button" disabled={saving} onClick={clearChecked} className="mt-2 w-full py-1 text-[11px] font-bold text-[#8a6a52]" data-testid="button-clear-checked">Clear checked items</button>}
          </div>
          <button type="button" className="fh-btn w-full" disabled={saving || ws.groceries.every((g) => g.checked)} onClick={toBasket} data-testid="button-groceries-to-cart"><ShoppingBasket size={15} /> Add unchecked to cart</button>
          <Unavailable title="Grocery delivery is not connected">No store or delivery partner is linked. The cart keeps your list together, but nothing can be ordered or delivered.</Unavailable>
        </aside>
      </div>
    </div>
  );
}
