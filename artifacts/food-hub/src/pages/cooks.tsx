import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowRight, Languages, Video, Home as HomeIcon } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, EmptyState, Initials, SampleBadge, Unavailable, NotFoundInline } from '@/components/fh';
import { useFoodData, usePageMeta, imgSrc, money } from '@/lib/food';

export function CooksPage() {
  usePageMeta('Home cooks', 'Browse sample home-cook profiles for Egyptian cooking lessons.');
  const { catalog, isLoading, error, retry } = useFoodData();
  const initialDish = new URLSearchParams(window.location.search).get('dish') ?? 'all';
  const [dish, setDish] = useState(initialDish);
  const [q, setQ] = useState('');
  const list = useMemo(() => (catalog?.cooks ?? []).filter((c) =>
    (dish === 'all' || c.dishes.includes(dish)) &&
    `${c.name} ${c.area} ${c.languages.join(' ')}`.toLowerCase().includes(q.toLowerCase())), [catalog, dish, q]);

  if (isLoading) return <LoadingState label="Loading cooks" />;
  if (error || !catalog) return <ErrorState onRetry={retry} />;

  return (
    <div>
      <PageHeader eyebrow="Real kitchens, real know-how" title="Learn from a home cook" subtitle="These are sample profiles that show how lessons will work. They are not verified providers yet." />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-[14px] border-2 border-[#397552] bg-[#e8f0e5] p-3 text-[12px] font-bold text-[#315641]"><Video size={15} /> Online video</div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#e7e5da] bg-[#f3f2e8] p-3 text-[12px] font-bold text-[#8a8f84]" aria-disabled="true"><HomeIcon size={15} /> Home visit · unavailable</div>
      </div>
      <input aria-label="Search cooks by name, area or language" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, area, language..." className="fh-input mb-3" data-testid="input-cook-search" />
      <div className="fh-scroll mb-4 flex gap-2 overflow-x-auto">
        <button type="button" className="fh-chip" aria-pressed={dish === 'all'} onClick={() => setDish('all')}>Any dish</button>
        {catalog.recipes.map((r) => <button key={r.id} type="button" className="fh-chip" aria-pressed={dish === r.id} onClick={() => setDish(r.id)} data-testid={`chip-dish-${r.id}`}>{r.title}</button>)}
      </div>
      {list.length === 0 ? <EmptyState title="No cooks match" body="Try another dish or clear the search." /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Link key={c.id} href={`/cooks/${c.id}`} className="fh-card fh-fade-up block p-4" data-testid={`card-cook-${c.id}`}>
              <div className="flex items-center gap-3">
                <Initials name={c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><span className="text-[15px] font-extrabold">{c.name}</span><span className="text-[12px] font-extrabold text-[#846647]">{money(c.hourlyRate, c.currency)}<small className="font-medium">/hr</small></span></div>
                  <p className="mt-1 text-[11px] text-[#717d71]">{c.area}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{c.dishes.map((d) => <span key={d} className="rounded-full bg-[#f1f0e6] px-2.5 py-1 text-[10px] font-bold text-[#657161]">{catalog.recipes.find((r) => r.id === d)?.title ?? d}</span>)}</div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-[#788177]"><span className="flex items-center gap-1"><Languages size={11} /> {c.languages.join(' · ')}</span>{c.sample && <SampleBadge />}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CookProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { catalog, isLoading, error, retry } = useFoodData();
  const cook = catalog?.cooks.find((c) => c.id === id);
  usePageMeta(cook ? `${cook.name}, home cook` : 'Home cook', cook ? `${cook.name} sample profile, ${cook.area}` : 'Sample home-cook profile');
  if (isLoading) return <LoadingState label="Loading profile" />;
  if (error || !catalog) return <ErrorState onRetry={retry} />;
  if (!cook) return <NotFoundInline what="Cook" back="/cooks" />;
  const dishes = catalog.recipes.filter((r) => cook.dishes.includes(r.id));
  return (
    <div>
      <PageHeader back="/cooks" eyebrow={`Home cook · ${cook.area} · ${cook.languages.join(', ')}`} title={cook.name} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-[20px] bg-[#e8efe4] p-4">
            <div className="flex items-center gap-3"><Initials name={cook.name} size="lg" /><div><p className="text-[17px] font-extrabold">{cook.name}</p><p className="text-[11px] text-[#657566]">{cook.area}</p></div>{cook.sample && <SampleBadge className="ml-auto" />}</div>
            <p className="mt-3 text-[11px] leading-[1.55] text-[#5d6d5e]">No reviews, lesson counts or ratings are shown because this profile is a sample and no lessons have taken place.</p>
          </div>
          <p className="fh-card p-4 text-[13px] leading-6 text-[#626e62]">{cook.bio}</p>
          <h2 className="text-[15px] font-extrabold">Signature dishes</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dishes.map((d) => <Link key={d.id} href={`/recipes/${d.id}`} className="overflow-hidden rounded-[14px] bg-[#fffdf7]"><img src={imgSrc(d.image)} alt={d.title} className="h-[96px] w-full object-cover" /><span className="block truncate p-2 text-[11px] font-bold">{d.title}</span></Link>)}
          </div>
        </div>
        <div className="space-y-3 lg:sticky lg:top-8 lg:self-start">
          <Unavailable title="Not verified">Identity, kitchen hygiene and trial lessons are not checked in this version. Treat this profile as an example only.</Unavailable>
          <Link href={`/book/${cook.id}`} className="fh-btn w-full" data-testid="link-book">From {money(cook.hourlyRate, cook.currency)} / hr · Draft a lesson request <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
