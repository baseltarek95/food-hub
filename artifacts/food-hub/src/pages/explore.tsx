import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, Plus, Search, Sparkles, X } from 'lucide-react';
import { useMatchFoodIngredients, type RecipeMatch } from '@workspace/api-client-react';
import { PageHeader, RecipeCard, LoadingState, ErrorState, EmptyState } from '@/components/fh';
import { useFoodData, usePageMeta, imgSrc, errMessage } from '@/lib/food';
import { useToggleSave } from '@/pages/home';

const STARTERS = ['Chicken', 'Rice', 'Tomato', 'Onion', 'Garlic', 'Lentils', 'Eggs'];

export default function ExplorePage() {
  usePageMeta('Explore recipes', 'Search Egyptian recipes and match dishes to the ingredients in your fridge.');
  const { catalog, isLoading, error, retry } = useFoodData();
  const { saved, toggle, saving } = useToggleSave();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [selected, setSelected] = useState<string[]>(['Chicken', 'Rice', 'Tomato', 'Onion']);
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState('');
  const [results, setResults] = useState<RecipeMatch[] | null>(null);
  const match = useMatchFoodIngredients();

  useEffect(() => {
    if (window.location.hash === '#fridge') document.getElementById('fridge')?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading]);

  const chips = useMemo(() => Array.from(new Set([...STARTERS, ...selected])), [selected]);
  const tabs = useMemo(() => ['All', ...Array.from(new Set((catalog?.recipes ?? []).map((r) => r.category))), 'Vegetarian'], [catalog]);
  const list = useMemo(() => (catalog?.recipes ?? []).filter((r) => {
    const q = query.toLowerCase();
    const hit = !q || `${r.title} ${r.subtitle} ${r.description} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase().includes(q);
    const cat = tab === 'All' || r.category === tab || (tab === 'Vegetarian' && r.vegetarian);
    return hit && cat;
  }), [catalog, query, tab]);

  const toggleItem = (item: string) => setSelected((cur) => (cur.includes(item) ? cur.filter((v) => v !== item) : [...cur, item]));
  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const v = custom.trim();
    if (!v) return setCustomError('Type an ingredient first.');
    if (v.length > 60) return setCustomError('Keep it under 60 characters.');
    if (selected.length >= 50) return setCustomError('You can match up to 50 ingredients.');
    setCustomError('');
    if (!selected.some((s) => s.toLowerCase() === v.toLowerCase())) setSelected([...selected, v]);
    setCustom('');
  };
  const runMatch = () => {
    if (selected.length === 0) return;
    match.mutate({ data: { ingredients: selected } }, { onSuccess: (r) => setResults([...r].sort((a, b) => b.percentage - a.percentage)) });
  };

  if (isLoading) return <LoadingState label="Loading recipes" />;
  if (error || !catalog) return <ErrorState onRetry={retry} />;

  return (
    <div>
      <PageHeader eyebrow="Explore" title="Find your next favourite" subtitle="Search the dishes you miss, or start from what is already in your fridge." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          <label className="flex items-center gap-2 rounded-[14px] border border-[#e5e6d9] bg-[#fffdf7] px-3">
            <Search size={16} className="text-[#829080]" aria-hidden />
            <input aria-label="Search recipes" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes or ingredients..." className="h-11 min-w-0 flex-1 bg-transparent text-[13px] outline-none" data-testid="input-explore-search" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
          </label>
          <div className="fh-scroll flex gap-2 overflow-x-auto">
            {tabs.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className="fh-chip" data-testid={`chip-tab-${t}`}>{t}</button>)}
          </div>
          <p className="text-[11px] font-semibold text-[#7b8477]" aria-live="polite">{list.length} {list.length === 1 ? 'recipe' : 'recipes'}</p>
          {list.length ? (
            <div className="grid gap-3 sm:grid-cols-2">{list.map((r, i) => <RecipeCard key={r.id} recipe={r} wide index={i} saved={saved.includes(r.id)} saving={saving} onToggleSave={() => toggle(r.id, r.title)} />)}</div>
          ) : (
            <EmptyState title="Nothing matches that search" body="Try a dish name like koshari, or an ingredient like lentils." action={<button type="button" className="fh-btn-2 px-5" onClick={() => { setQuery(''); setTab('All'); }}>Clear filters</button>} />
          )}
        </div>

        <section id="fridge" aria-labelledby="fridge-heading" className="scroll-mt-6 lg:sticky lg:top-8">
          <div className="rounded-[18px] bg-[#21372a] p-4 text-[#fffdf3] md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#d5dfce]">Fridge chef · ingredient matcher</p>
                <h2 id="fridge-heading" className="mt-1 text-[17px] font-extrabold">What's in your fridge?</h2>
              </div>
              <Sparkles size={19} aria-hidden />
            </div>
            <p className="mt-1 text-[11px] leading-[1.5] text-[#d6dfd3]">Tap ingredients, find dinner. This is a simple overlap match against our recipe list. AI is not connected.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((item) => {
                const on = selected.includes(item);
                return (
                  <button key={item} type="button" aria-pressed={on} onClick={() => toggleItem(item)} data-testid={`chip-ingredient-${item}`}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${on ? 'bg-[#e8eedf] text-[#315641]' : 'border border-white/25 text-white'}`}>
                    {on && <Check size={10} className="mr-1 inline" />}{item}
                  </button>
                );
              })}
            </div>
            <form onSubmit={addCustom} className="mt-3" noValidate>
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="custom-ingredient">Add an ingredient</label>
                <input id="custom-ingredient" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add another, e.g. molokhia" aria-invalid={!!customError}
                  className="h-10 min-w-0 flex-1 rounded-[12px] border border-white/20 bg-white/10 px-3 text-[12px] text-white outline-none placeholder:text-[#b8c7b6]" data-testid="input-custom-ingredient" />
                <button type="submit" aria-label="Add ingredient" className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/15"><Plus size={16} /></button>
              </div>
              {customError && <p className="mt-1.5 text-[11px] font-semibold text-[#f3c3b0]">{customError}</p>}
            </form>
            <button type="button" onClick={runMatch} disabled={match.isPending || selected.length === 0} data-testid="button-match"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f1e7d4] py-2.5 text-[12px] font-extrabold text-[#315641] disabled:opacity-60">
              {match.isPending ? 'Matching...' : selected.length === 0 ? 'Pick at least one ingredient' : <>Find my recipes <ArrowRight size={14} /></>}
            </button>
          </div>
          <div className="mt-3 space-y-2" aria-live="polite">
            {match.isError && <p role="alert" className="rounded-[12px] bg-[#f6e3db] p-3 text-[12px] text-[#8a3f2a]">{errMessage(match.error)}</p>}
            {match.isPending && [0, 1].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-[16px] bg-[#ecebdf]" />)}
            {results && !match.isPending && results.length === 0 && <EmptyState title="No overlap yet" body="None of our recipes use those ingredients. Try adding a staple like rice or onion." />}
            {results && !match.isPending && results.map((m) => {
              const r = catalog.recipes.find((x) => x.id === m.recipeId);
              if (!r) return null;
              return (
                <Link key={m.recipeId} href={`/recipes/${r.id}`} className="flex gap-3 rounded-[16px] border border-[#e7e6da] bg-[#fffdf7] p-3" data-testid={`link-match-${r.id}`}>
                  <img src={imgSrc(r.image)} alt="" className="h-[64px] w-[72px] rounded-[12px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><b className="truncate text-[13px]">{r.title}</b><span className="shrink-0 rounded-full bg-[#e8efe3] px-2 py-0.5 text-[10px] font-extrabold text-[#315641]">{Math.round(m.percentage)}% match</span></span>
                    <span className="mt-1 block text-[10px] text-[#55705a]">Have: {m.matched.join(', ') || 'none'}</span>
                    <span className="block truncate text-[10px] text-[#9a7a5a]">Missing: {m.missing.join(', ') || 'nothing'}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
