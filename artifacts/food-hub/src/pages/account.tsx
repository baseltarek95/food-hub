import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, ChevronDown, ChevronRight, ShoppingBasket, Trash2, Video, Home as HomeIcon } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, EmptyState, Unavailable, SampleBadge, RecipeCard, Logo } from '@/components/fh';
import { useFoodData, useSaveWorkspace, usePageMeta, useSummary, imgSrc, money, prettyDateTime, uid } from '@/lib/food';
import { useRemoveLessonRequest } from '@/pages/booking';
import { useToggleSave } from '@/pages/home';
import { AccountControls } from '@/components/auth';

export function CoursesPage() {
  usePageMeta('Courses', 'Sample Egyptian cooking course catalog and curricula.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const inBasket = (id: string) => ws.basket.some((b) => b.kind === 'course' && b.referenceId === id);
  const progress = (id: string) => ws.courseProgress.find((p) => p.courseId === id)?.completed ?? [];
  const toggleLesson = (courseId: string, idx: number) => {
    const cur = progress(courseId);
    const next = cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx].sort((a, b) => a - b);
    const rest = ws.courseProgress.filter((p) => p.courseId !== courseId);
    void save({ courseProgress: [...rest, { courseId, completed: next }] });
  };
  return (
    <div>
      <PageHeader eyebrow="Courses" back="/" title="Learn at your own pace" subtitle="A sample catalog. There are no videos or paid access yet; you can read each curriculum and tick off what you've practised at home." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalog.courses.map((c) => {
          const done = progress(c.id);
          const isOpen = open === c.id;
          return (
            <article key={c.id} className="overflow-hidden rounded-[17px] border border-[#e7e6da] bg-[#fffdf7]" data-testid={`card-course-${c.id}`}>
              <img src={imgSrc(c.image)} alt={c.title} className="h-[140px] w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><h2 className="text-[14px] font-extrabold">{c.title}</h2>{c.sample && <SampleBadge />}</div>
                <p className="mt-1 text-[11px] text-[#758073]">{c.teacher} · {c.lessons.length} lessons</p>
                <p className="mt-2 text-[11px] leading-[1.55] text-[#667265]">{c.description}</p>
                <p className="mt-2 text-[12px] font-extrabold text-[#366449]">{money(c.price, catalog.currency)} · {done.length}/{c.lessons.length} practised</p>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c.id)} className="mt-3 flex w-full items-center justify-between text-[12px] font-bold text-[#315641]" data-testid={`button-curriculum-${c.id}`}>Curriculum <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} /></button>
                {isOpen && (
                  <ol className="mt-2">
                    {c.lessons.map((l, i) => (
                      <li key={i}><button type="button" role="checkbox" aria-checked={done.includes(i)} disabled={saving} onClick={() => toggleLesson(c.id, i)} className="flex w-full items-center gap-2 border-t border-[#eeece3] py-2 text-left text-[11px]">
                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${done.includes(i) ? 'border-[#447251] bg-[#447251] text-white' : 'border-[#bdc3b6]'}`}>{done.includes(i) && <Check size={10} />}</span>{i + 1}. {l}</button></li>
                    ))}
                  </ol>
                )}
                <button type="button" disabled={saving || inBasket(c.id)} onClick={() => void save({ basket: [...ws.basket, { id: uid('b'), kind: 'course', referenceId: c.id, quantity: 1 }] }, `${c.title} added to cart`)} className="fh-btn-2 mt-3 w-full" data-testid={`button-add-course-${c.id}`}>
                  <ShoppingBasket size={14} /> {inBasket(c.id) ? 'In your cart' : 'Add to cart'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-4"><Unavailable title="No course videos or access">Course content is not published and purchase is not possible. Adding to cart only keeps a note of interest.</Unavailable></div>
    </div>
  );
}

const nickSchema = z.object({ nickname: z.string().trim().min(1, 'Enter a nickname.').max(60, 'Keep it under 60 characters.') });

export function ProfilePage() {
  usePageMeta('Profile', 'Your cooking workspace: nickname, saved recipes, meal plans and lesson drafts.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const summary = useSummary();
  const { save, saving } = useSaveWorkspace();
  const { saved, toggle, saving: togg } = useToggleSave();
  const { remove, pending } = useRemoveLessonRequest();
  const [editing, setEditing] = useState(false);
  const form = useForm<z.infer<typeof nickSchema>>({ resolver: zodResolver(nickSchema), defaultValues: { nickname: '' } });
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const onSubmit = form.handleSubmit(async (v) => { if (await save({ nickname: v.nickname }, 'Nickname saved')) setEditing(false); });
  const s = summary.data;
  return (
    <div>
      <PageHeader eyebrow={`${ws.nickname}'s kitchen`} title="Your Food Hub" subtitle={ws.guest ? "Saved in this browser as a guest. Sign in to keep your kitchen across devices." : "Your recipes, plans and drafts are saved to your account across devices."} />
      <div className="mb-5"><AccountControls /></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="rounded-[18px] bg-[#e8efe4] p-4">
            {editing ? (
              <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1"><label htmlFor="nick" className="fh-label">Nickname</label><input id="nick" {...form.register('nickname')} aria-invalid={!!form.formState.errors.nickname} className="fh-input mt-1.5" data-testid="input-nickname" />{form.formState.errors.nickname && <p className="fh-error">{form.formState.errors.nickname.message}</p>}</div>
                <div className="flex gap-2 pt-6"><button type="submit" disabled={saving} className="fh-btn px-4" data-testid="button-save-nickname">{saving ? 'Saving...' : 'Save'}</button><button type="button" onClick={() => setEditing(false)} className="fh-btn-2 px-4">Cancel</button></div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#efd2b6] text-[16px] font-extrabold text-[#674b34]">{ws.nickname.slice(0, 1).toUpperCase()}</div>
                <div><p className="text-[16px] font-extrabold" data-testid="text-nickname">{ws.nickname}</p><p className="text-[11px] text-[#748073]">{ws.guest ? 'Guest workspace' : 'Account workspace'}</p></div>
                <button type="button" onClick={() => { form.reset({ nickname: ws.nickname }); setEditing(true); }} className="ml-auto rounded-full bg-white px-3 py-2 text-[10px] font-bold" data-testid="button-edit-nickname">Edit</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {([['Saved recipes', s?.savedRecipes], ['Planned meals', s?.plannedMeals], ['Grocery items', s?.groceryItems], ['Lesson drafts', s?.lessonRequests], ['Lessons practised', s?.completedLessons]] as const).map(([a, b]) => (
              <div key={a} className="rounded-[15px] border border-[#e8e6db] bg-[#fffdf7] p-3"><span className="block text-[10px] text-[#7e887b]">{a}</span>{summary.isLoading ? <span className="mt-1 block h-4 w-8 animate-pulse rounded bg-[#ecebdf]" /> : <b className="mt-1 block text-[15px]">{b ?? '-'}</b>}</div>
            ))}
          </div>
          {summary.isError && <p className="text-[11px] text-[#8a3f2a]">Summary could not load. <button type="button" className="underline" onClick={() => void summary.refetch()}>Retry</button></p>}
          <h2 className="text-[15px] font-extrabold">Saved recipes</h2>
          {saved.length === 0 ? <EmptyState title="Nothing saved yet" body="Tap the bookmark on any recipe to keep it here." action={<Link href="/explore" className="fh-btn-2 px-4">Explore recipes</Link>} /> : (
            <div className="grid gap-3 sm:grid-cols-2">{catalog.recipes.filter((r) => saved.includes(r.id)).map((r) => <RecipeCard key={r.id} recipe={r} wide saved saving={togg} onToggleSave={() => toggle(r.id, r.title)} />)}</div>
          )}
          <h2 className="text-[15px] font-extrabold">Lesson request drafts</h2>
          {ws.lessonRequests.length === 0 ? <EmptyState title="No drafts" body="Draft an online lesson request from a sample cook profile." action={<Link href="/cooks" className="fh-btn-2 px-4">Browse cooks</Link>} /> : (
            <div className="space-y-2">
              {ws.lessonRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-[15px] border border-[#e7e5da] bg-[#fffdf7] p-3" data-testid={`row-request-${r.id}`}>
                  <div className="min-w-0 flex-1"><p className="text-[12px] font-extrabold">{catalog.recipes.find((x) => x.id === r.recipeId)?.title ?? 'Lesson'} · {catalog.cooks.find((c) => c.id === r.cookId)?.name ?? 'Cook'}</p><p className="text-[10px] text-[#7a8377]">{prettyDateTime(r.startsAt)} · {r.packageSize}x · {money(r.total, r.currency)} · draft</p></div>
                  <Link href={`/lesson/${r.id}`} aria-label="Open lesson screen" className="p-1 text-[#39664c]"><Video size={15} /></Link>
                  <button type="button" disabled={pending} onClick={() => { if (window.confirm('Delete this lesson draft?')) remove(r.id); }} aria-label="Delete draft" className="p-1 text-[#8a6a52]" data-testid={`button-delete-request-${r.id}`}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[16px] border border-[#e6e5d9] bg-[#fffdf7]">
            {[['Cart', '/cart'], ['Vouchers', '/vouchers'], ['Courses', '/courses'], ['Grocery list', '/planner'], ['About Food Hub', '/welcome'], ['Lesson review', '/lesson-complete']].map(([l, h]) => (
              <Link key={h} href={h} className="flex w-full justify-between border-b border-[#eeece3] p-3 text-[12px] font-semibold">{l}<ChevronRight size={13} /></Link>
            ))}
          </div>
          <Link href="/become-a-cook" className="block w-full rounded-[17px] bg-[#eaf0e4] p-4"><b className="text-[13px]">Love cooking? Teach on Food Hub</b><span className="mt-1 block text-[10px] text-[#72806f]">Draft a home-cook application</span></Link>
          {ws.cookDraft && <Link href="/cook-dashboard" className="fh-btn-2 w-full">Your cook dashboard</Link>}
        </div>
      </div>
    </div>
  );
}

export function CookDashboardPage() {
  usePageMeta('Cook dashboard', 'Your draft home-cook application. No earnings or bookings.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const d = ws.cookDraft;
  const cur = catalog.currency;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back="/profile" eyebrow="Home cook studio · draft" title={d ? `Welcome, ${d.displayName}` : 'Your cook studio'} subtitle="This reflects your draft application only. You are not listed and cannot receive lessons." />
      {!d ? <EmptyState title="No application draft yet" body="Start a draft to see how your studio would look." action={<Link href="/become-a-cook" className="fh-btn px-5">Start a draft</Link>} /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[17px] bg-[#e8efe4] p-4"><div><p className="text-[11px] font-bold text-[#698066]">Status</p><p className="text-[15px] font-extrabold">Draft · not published</p></div><span className="rounded-full bg-[#b5c2a8] px-3 py-2 text-[10px] font-extrabold">Not taking lessons</span></div>
          <div className="rounded-[18px] bg-[#20362a] p-4 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#d0ddcc]">Earnings</p><p className="mt-2 text-[28px] font-extrabold" data-testid="text-earnings">{money(0, cur)}</p><p className="mt-1 text-[10px] text-[#d0ddcc]">No lessons, bookings or payouts exist. We don't show projections.</p></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[['Display name', d.displayName], ['Area', d.area || 'Not set'], ['Dishes', d.dishes || 'Not set'], ['Rate', `${money(d.rate, cur)} / hr`], ['Hours per week', `${d.hours}`], ['Format', d.format === 'online' ? 'Online' : 'Home visit (not available)']].map(([a, b]) => (
              <div key={a} className="rounded-[14px] border border-[#e7e5da] bg-[#fffdf7] p-3"><p className="text-[10px] text-[#7e887b]">{a}</p><p className="mt-1 text-[12px] font-bold">{b}</p></div>
            ))}
          </div>
          <div className="fh-card p-4"><p className="text-[12px] font-extrabold">Upcoming lessons</p><p className="mt-1 text-[11px] text-[#7b8377]">None. Learners cannot book draft profiles.</p></div>
          <Unavailable title="Verification and payouts are unavailable">ID checks, kitchen review, trial lessons and withdrawals are not offered in this version.</Unavailable>
          <Link href="/become-a-cook" className="fh-btn w-full">Edit draft <ArrowRight size={14} /></Link>
        </div>
      )}
    </div>
  );
}

const draftSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a display name.').max(60, 'Max 60 characters.'),
  area: z.string().trim().max(100, 'Max 100 characters.'),
  dishes: z.string().trim().min(1, 'List at least one dish.').max(500, 'Max 500 characters.'),
  rate: z.coerce.number({ invalid_type_error: 'Enter a number.' }).min(0, 'Rate cannot be negative.').max(10000, 'Max 10,000.'),
  hours: z.coerce.number().int('Whole hours only.').min(1, 'At least 1 hour.').max(60, 'Max 60 hours.'),
});
type DraftValues = z.infer<typeof draftSchema>;

export function BecomeCookPage() {
  usePageMeta('Become a home cook', 'Draft a home-cook application. Verification is not available yet.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  const d = ws?.cookDraft;
  const form = useForm<DraftValues>({
    resolver: zodResolver(draftSchema),
    values: { displayName: d?.displayName ?? '', area: d?.area ?? '', dishes: d?.dishes ?? '', rate: d?.rate ?? 250, hours: d?.hours ?? 4 },
    resetOptions: { keepDirtyValues: true },
  });
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const e = form.formState.errors;
  const hours = form.watch('hours');
  const onSubmit = form.handleSubmit(async (v) => { await save({ cookDraft: { ...v, format: 'online' } }, 'Application draft saved'); });
  const field = (name: keyof DraftValues, label: string, props: Record<string, unknown> = {}) => (
    <label className="fh-label">{label}
      <input {...form.register(name)} {...props} aria-invalid={!!e[name]} className="fh-input mt-1.5" data-testid={`input-${name}`} />
      {e[name] && <p className="fh-error">{e[name]?.message}</p>}
    </label>
  );
  const steps: [string, string, boolean][] = [['Your details', 'Name, area, dishes', !!d], ['Verify your ID', 'Not collected · unavailable', false], ['Show your kitchen', 'Not collected · unavailable', false], ['Trial lesson', 'Unavailable', false], ['Get paid', 'Unavailable', false]];
  return (
    <div>
      <PageHeader back="/profile" eyebrow="Become a home cook · draft" title="Share the food you know by heart" subtitle="Save a draft of how you'd teach. We don't collect ID or photos, and nothing is published." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="fh-card grid gap-3 p-4 sm:grid-cols-2">
            {field('displayName', 'Display name')}
            {field('area', 'Area (city or district, optional)')}
            <label className="fh-label sm:col-span-2">Dishes you'd teach
              <textarea {...form.register('dishes')} aria-invalid={!!e.dishes} rows={3} placeholder="Mahshi, molokhia, fattah" className="fh-input mt-1.5 h-auto py-2" data-testid="input-dishes" />
              {e.dishes && <p className="fh-error">{e.dishes.message}</p>}
            </label>
            {field('rate', `Hourly rate (${catalog.currency})`, { type: 'number', min: 0, max: 10000 })}
            <div>
              <label className="fh-label" htmlFor="hours">Hours per week · <span className="text-[#35714c]">{hours || '-'} hrs</span></label>
              <input id="hours" type="range" min={1} max={60} {...form.register('hours')} className="mt-3 w-full accent-[#34704d]" data-testid="input-hours" />
              {e.hours && <p className="fh-error">{e.hours.message}</p>}
            </div>
          </div>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="fh-label mb-1.5">Lesson format</legend>
            <div className="rounded-[14px] border-2 border-[#397552] bg-[#e8f0e5] p-3 text-[12px] font-bold text-[#315641]"><Video size={14} className="mr-1 inline" />Online</div>
            <div className="rounded-[14px] border border-[#e7e5da] bg-[#f3f2e8] p-3 text-[12px] font-bold text-[#8a8f84]" aria-disabled="true"><HomeIcon size={14} className="mr-1 inline" />Home visits · unavailable</div>
          </fieldset>
          <button type="submit" disabled={saving} className="fh-btn w-full" data-testid="button-save-cook-draft">{saving ? 'Saving...' : 'Save draft'}</button>
          {d && <Link href="/cook-dashboard" className="block text-center text-[12px] font-bold text-[#376249]">Preview your cook dashboard</Link>}
        </form>
        <div className="space-y-2">
          {steps.map(([n, det, done], i) => (
            <div key={n} className="flex items-center gap-3 rounded-[16px] border border-[#ebe8dc] bg-[#fffdf7] p-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${done ? 'bg-[#377550] text-white' : 'bg-[#f0efe8] text-[#7e8274]'}`}>{done ? <Check size={15} /> : i + 1}</span>
              <span><b className="block text-[12px]">{n}</b><small className="text-[10px] text-[#7a8377]">{det}</small></span>
            </div>
          ))}
          <Unavailable title="Your details stay yours">We never ask for ID, selfies or kitchen photos here. Verification is not available, so drafts can't be published or earn money.</Unavailable>
        </div>
      </div>
    </div>
  );
}

export function WelcomePage() {
  usePageMeta('Welcome', 'Food Hub: Egyptian home cooking, recipes and home-cook learning for families and expats.');
  const [lang, setLang] = useState(false);
  const noop = (ev: FormEvent) => ev.preventDefault();
  return (
    <div className="mx-auto max-w-4xl" onSubmit={noop}>
      <div className="pt-2"><Logo /></div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-center">
        <div className="relative h-[280px] overflow-hidden rounded-[25px] md:h-[440px]">
          <img src={imgSrc('molokhia.jpg')} alt="Homemade Egyptian molokhia with chicken and rice" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#172a1e]/75 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-full bg-[#fffdf3]/95 px-3 py-1.5 text-[11px] font-bold text-[#315641]">A taste of home</span>
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-[32px] font-extrabold leading-[1.08] tracking-[-1.2px] md:text-[44px]">Cook it. Learn it. Love it.</h1>
          <p className="text-[13px] leading-6 text-[#667365]">Egyptian recipes with guided cook mode, a family meal planner, and sample home-cook lessons, for families and expats missing the taste of home.</p>
          <Link href="/" className="fh-btn w-full" data-testid="link-continue-guest">Continue as guest <ArrowRight size={15} /></Link>
          <Link href="/become-a-cook" className="fh-btn-2 w-full">I want to teach</Link>
          <AccountControls />
          <p className="rounded-[14px] bg-[#f3f2e8] p-3 text-[11px] leading-[1.55] text-[#6f786c]">No account needed to browse or plan. Guest work is tied to this browser's cookie. Sign in to keep it across devices, then explicitly choose to import your browser workspace.</p>
          <button type="button" onClick={() => setLang(!lang)} className="w-full py-2 text-[12px] font-bold text-[#657668]" aria-expanded={lang}>Arabic language</button>
          {lang && <p className="text-center text-[11px] text-[#7b8377]">An Arabic interface is not available yet.</p>}
        </div>
      </div>
    </div>
  );
}
