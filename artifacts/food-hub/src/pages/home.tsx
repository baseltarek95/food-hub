import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, ChefHat, Flame, ListFilter, MapPin, Search, Sparkles, X } from 'lucide-react';
import { Logo, RecipeCard, LoadingState, ErrorState, EmptyState } from '@/components/fh';
import { useFoodData, useSaveWorkspace, usePageMeta } from '@/lib/food';

export function useToggleSave() {
  const { ws } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  const saved = ws?.savedRecipeIds ?? [];
  const toggle = (id: string, title: string) => {
    if (!ws) return;
    const has = saved.includes(id);
    const next = has ? saved.filter((x) => x !== id) : [...saved, id];
    void save({ savedRecipeIds: next }, has ? `${title} removed from saved recipes` : `${title} saved for later`);
  };
  return { saved, toggle, saving };
}

export default function HomePage() {
  usePageMeta('Home', 'Egyptian home cooking, guided recipes and learning from home cooks.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { saved, toggle, saving } = useToggleSave();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set((catalog?.recipes ?? []).map((r) => r.category))), 'Vegetarian'], [catalog]);
  const visible = useMemo(() => (catalog?.recipes ?? []).filter((r) => {
    const q = query.toLowerCase();
    const matchesSearch = !q || `${r.title} ${r.subtitle} ${r.category} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase().includes(q);
    const matchesCat = category === 'All' || r.category === category || (category === 'Vegetarian' && r.vegetarian);
    return matchesSearch && matchesCat;
  }), [catalog, query, category]);

  if (isLoading) return <LoadingState label="Loading home" />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;

  const name = ws.nickname || 'Guest';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div>
      <header className="fh-fade-up">
        <div className="flex items-center justify-between pb-4">
          <span className="md:invisible"><Logo /></span>
          <Link href="/profile" className="flex h-10 items-center gap-2 rounded-full border border-[#e5e7d9] bg-[#fffdf7]/90 px-3" data-testid="link-profile-greeting">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f2dfc8] text-[10px] font-extrabold text-[#754b32]">{initials}</span>
            <span className="text-[12px] font-bold text-[#304337]">Hi, {name}</span>
          </Link>
        </div>
        <h1 className="font-display text-[27px] font-extrabold leading-[1.12] tracking-[-1.2px] text-[#26392d] md:text-[40px]">What feels like home<br />today<span className="text-[#d77a4a]">?</span></h1>
        <label className="mt-4 flex h-11 max-w-xl items-center gap-2.5 rounded-[15px] border border-[#e7e5d9] bg-[#fffdf7] px-3.5 shadow-[0_3px_9px_rgba(53,65,48,.035)]">
          <Search size={17} className="shrink-0 text-[#7f8e7c]" />
          <input aria-label="Search recipes" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes, ingredients..." data-testid="input-home-search"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#26392d] outline-none placeholder:text-[#9b9f93]" />
          {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full text-[#7c887c]"><X size={14} /></button> : <ListFilter size={16} className="text-[#687a69]" aria-hidden />}
        </label>
      </header>

      <section className="pt-6" aria-labelledby="recipes-heading">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="fh-eyebrow">Made for your table</p>
            <h2 id="recipes-heading" className="mt-0.5 font-display text-[19px] font-extrabold tracking-[-.6px]">Recipes to come home to</h2>
          </div>
          <Link href="/explore" className="flex items-center gap-1 text-[11px] font-bold text-[#39664c]" data-testid="link-see-all">See all <ArrowRight size={13} /></Link>
        </div>
        <div className="fh-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-3 md:mx-0 md:px-0">
          {categories.map((c) => <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className="fh-chip" data-testid={`chip-category-${c}`}>{c}</button>)}
        </div>
        {visible.length > 0 ? (
          <div className="fh-scroll -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {visible.map((r, i) => <RecipeCard key={r.id} recipe={r} index={i} saved={saved.includes(r.id)} saving={saving} onToggleSave={() => toggle(r.id, r.title)} />)}
          </div>
        ) : (
          <EmptyState title="No dishes found just yet" body="Try another search or browse all recipes." action={<button type="button" className="fh-btn-2 px-5" onClick={() => { setQuery(''); setCategory('All'); }}>Show all recipes</button>} />
        )}
      </section>

      <section className="pt-7">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <p className="fh-eyebrow">Your kitchen, your way</p>
            <h2 className="mt-0.5 font-display text-[18px] font-extrabold tracking-[-.55px]">A little help for today</h2>
          </div>
          <Sparkles size={17} className="mb-1 text-[#cb8755]" aria-hidden />
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label: 'Fridge chef', sub: 'Use what you have', href: '/explore#fridge', icon: <Flame size={17} />, tone: 'bg-[#f5e8d7] text-[#98623c]' },
            { label: 'Meal planner', sub: 'Plan the week', href: '/planner', icon: <Check size={17} />, tone: 'bg-[#e8efe3] text-[#4d7453]' },
            { label: 'Learn from a home cook', sub: 'Sample cooks', href: '/cooks', icon: <ChefHat size={17} />, tone: 'bg-[#f1e7e5] text-[#9b5c4b]' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="min-h-[100px] rounded-[16px] border border-[#ebe7dc] bg-[#fffdf7] p-3 text-left transition-transform active:scale-[.98] md:p-4" data-testid={`link-shortcut-${item.href.slice(1)}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-[11px] ${item.tone}`}>{item.icon}</span>
              <span className="mt-2 block text-[11px] font-extrabold leading-[1.15] text-[#344538] md:text-[13px]">{item.label}</span>
              <span className="mt-1 block text-[9px] font-medium leading-tight text-[#8a9084] md:text-[11px]">{item.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <div className="relative overflow-hidden rounded-[19px] bg-[#285c43] px-4 py-4 text-[#fffdf3] md:px-6 md:py-5">
          <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border border-white/10" />
          <div className="absolute -right-1 -top-1 h-16 w-16 rounded-full border border-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#d8e2d0]">From kitchens like yours</p>
              <p className="mt-1 font-display text-[16px] font-extrabold tracking-[-.4px]">Recipes carry a story.</p>
              <p className="mt-0.5 text-[11px] text-[#e3eadf]">Browse sample home-cook profiles and short courses.</p>
            </div>
            <Link href="/cooks" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4f0dd] text-[#285c43]" aria-label="Explore home cooks"><ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
          <Link href="/welcome" className="font-bold text-[#39664c]">About Food Hub</Link>
          <Link href="/courses" className="font-bold text-[#39664c]">Courses</Link>
          <Link href="/cart" className="font-bold text-[#39664c]">Cart</Link>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-[#98988b]"><MapPin size={11} /> Made for Egyptian kitchens, wherever you call home</p>
      </section>
    </div>
  );
}
