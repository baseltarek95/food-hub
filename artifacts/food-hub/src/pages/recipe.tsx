import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { Bookmark, Check, ChefHat, Play, ShoppingBasket, CalendarPlus } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, NotFoundInline, Stepper } from '@/components/fh';
import { useFoodData, useSaveWorkspace, usePageMeta, imgSrc, scaleQty, fmtQty, mergeGroceries } from '@/lib/food';
import { useToggleSave } from '@/pages/home';

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const recipe = catalog?.recipes.find((r) => r.id === id);
  usePageMeta(recipe?.title ?? 'Recipe', recipe ? `${recipe.title}: ${recipe.subtitle}` : 'Egyptian home recipe');
  const { saved, toggle, saving: savingToggle } = useToggleSave();
  const { save, saving } = useSaveWorkspace();
  const [servings, setServings] = useState<number | null>(null);
  const [have, setHave] = useState<string[]>([]);

  if (isLoading) return <LoadingState label="Loading recipe" />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  if (!recipe) return <NotFoundInline what="Recipe" back="/explore" />;

  const people = servings ?? recipe.servings;
  const scaled = recipe.ingredients.map((i) => ({ ...i, quantity: scaleQty(i.quantity, recipe.servings, people) }));
  const missing = scaled.filter((i) => !have.includes(i.name));
  const isSaved = saved.includes(recipe.id);
  const teachers = catalog.cooks.filter((c) => c.dishes.includes(recipe.id));

  const addGroceries = () => {
    if (missing.length === 0) return;
    void save({ groceries: mergeGroceries(ws.groceries, missing) }, `${missing.length} ingredients added to your grocery list`);
  };

  return (
    <div>
      <PageHeader back="/explore" eyebrow={`Egyptian · ${recipe.category}`} title={recipe.title} subtitle={recipe.subtitle}
        action={<button type="button" disabled={savingToggle} aria-pressed={isSaved} aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'} onClick={() => toggle(recipe.id, recipe.title)} className="rounded-full bg-[#e9efe4] p-2.5 text-[#315c43] disabled:opacity-60" data-testid="button-save-recipe"><Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} /></button>} />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="relative h-[240px] overflow-hidden rounded-[22px] md:h-[340px]">
            <img src={imgSrc(recipe.image)} alt={recipe.title} className="h-full w-full object-cover" />
          </div>
          <p className="text-[13px] leading-[1.7] text-[#5f6b5f]">{recipe.description}</p>
          <div className="grid grid-cols-3 gap-2">
            {[['Time', `${recipe.minutes} min`], ['Calories', `${recipe.calories} kcal`], ['Level', recipe.difficulty]].map(([a, b]) => (
              <div key={a} className="rounded-[14px] bg-[#f1f0e6] p-3"><p className="text-[10px] text-[#7c8478]">{a}</p><p className="mt-1 text-[13px] font-extrabold capitalize">{b}</p></div>
            ))}
          </div>
          <div className="fh-card p-4">
            <h2 className="text-[15px] font-extrabold">Method · {recipe.steps.length} steps</h2>
            <ol className="mt-2 space-y-2">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3 border-t border-[#eeece3] pt-2 text-[12px] leading-[1.6] text-[#4f5d50]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8efe3] text-[10px] font-extrabold text-[#315641]">{i + 1}</span>
                  <span>{s.text}{s.timerSeconds > 0 && <span className="ml-1 text-[10px] font-bold text-[#a17b59]">· {Math.round(s.timerSeconds / 60)} min timer</span>}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="fh-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Ingredients</h2>
              <div className="flex items-center gap-2"><Stepper label="servings" value={people} onChange={setServings} max={20} /><span className="text-[11px] font-bold">people</span></div>
            </div>
            <p className="mt-1 text-[11px] text-[#7b8477]">Tick what you already have. The rest can go on your grocery list.</p>
            <ul className="mt-2">
              {scaled.map((i) => {
                const on = have.includes(i.name);
                return (
                  <li key={i.name}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => setHave((h) => (on ? h.filter((x) => x !== i.name) : [...h, i.name]))} data-testid={`check-ingredient-${i.name}`}
                      className="flex w-full items-center gap-3 border-t border-[#eeece3] py-3 text-left text-[12px]">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? 'border-[#447251] bg-[#447251] text-white' : 'border-[#bdc3b6]'}`}>{on && <Check size={12} />}</span>
                      <span className={`flex-1 ${on ? 'text-[#90978a] line-through' : ''}`}>{i.name}</span>
                      <b>{fmtQty(i.quantity, i.unit)}</b>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <button type="button" className="fh-btn w-full" disabled={saving || missing.length === 0} onClick={addGroceries} data-testid="button-add-groceries">
            <ShoppingBasket size={16} /> {saving ? 'Saving...' : missing.length === 0 ? 'You have everything' : `Add ${missing.length} to grocery list`}
          </button>
          <Link href={`/cook/${recipe.id}?servings=${people}`} className="fh-btn-2 w-full" data-testid="link-start-cooking"><Play size={15} /> Start cooking</Link>
          <Link href={`/planner?recipe=${recipe.id}`} className="fh-btn-2 w-full" data-testid="link-plan-recipe"><CalendarPlus size={15} /> Add to meal plan</Link>
          <Link href={teachers.length ? `/cooks?dish=${recipe.id}` : '/cooks'} className="block w-full rounded-[15px] bg-[#f3e8d7] p-3 text-left text-[12px] font-bold text-[#6b553d]" data-testid="link-learn-live">
            <ChefHat size={14} className="mr-1 inline" /> Learn it with a home cook
            <span className="mt-1 block text-[10px] font-medium">{teachers.length ? `${teachers.length} sample ${teachers.length === 1 ? 'profile lists' : 'profiles list'} this dish` : 'Browse sample cook profiles'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
