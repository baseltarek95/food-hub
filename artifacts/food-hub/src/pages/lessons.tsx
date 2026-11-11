import { Link, useParams } from 'wouter';
import { Check, Star, Video } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState, Unavailable } from '@/components/fh';
import { useFoodData, usePageMeta, prettyDateTime } from '@/lib/food';

export function LiveLessonPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta('Online lesson', 'Video lessons are not available in this version.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const req = ws.lessonRequests.find((r) => r.id === id);
  const cook = catalog.cooks.find((c) => c.id === (req?.cookId ?? id));
  const recipe = catalog.recipes.find((r) => r.id === req?.recipeId);
  const name = cook?.name ?? 'your cook';
  return (
    <div>
      <PageHeader back="/profile" eyebrow="Online lesson · unavailable" title={`Your lesson with ${name}`} subtitle="Video calling is not connected, so no lesson can start here." />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative flex h-[340px] items-center justify-center overflow-hidden rounded-[23px] bg-[#233b2c] p-5 text-center text-white md:h-[420px]">
          <span className="absolute left-3 top-3 rounded-full bg-[#e8ece0] px-2.5 py-1.5 text-[10px] font-extrabold text-[#315641]">NOT CONNECTED</span>
          <div><span className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-full bg-[#f1d9c3] text-[18px] font-extrabold text-[#63462f]">{name.slice(0, 2).toUpperCase()}</span><p className="mt-3 text-[14px] font-extrabold">No camera feed</p><p className="mt-1 text-[11px] text-[#d2dfd3]">There is no video service behind this screen.</p></div>
        </div>
        <div className="space-y-3">
          {req ? (
            <div className="fh-card p-4"><p className="fh-eyebrow">Your draft request</p><p className="mt-1 text-[15px] font-extrabold">{recipe?.title ?? 'Lesson'} with {name}</p><p className="mt-1 text-[11px] text-[#7b8377]">{prettyDateTime(req.startsAt)} · online · draft only</p></div>
          ) : <p className="fh-card p-4 text-[12px] text-[#7b8377]">No saved draft matches this link.</p>}
          {recipe && <Link href={`/cook/${recipe.id}`} className="fh-btn-2 w-full">Practise with cook mode instead</Link>}
          <button type="button" disabled className="fh-btn w-full"><Video size={15} /> Join lesson · unavailable</button>
          <Unavailable title="Why this is unavailable">Food Hub does not yet have a video provider, verified cooks, or confirmed bookings. Joining would pretend a lesson exists when it doesn't.</Unavailable>
        </div>
      </div>
    </div>
  );
}

export function LessonCompletePage() {
  usePageMeta('Lesson review', 'Reviews open only after a real completed lesson.');
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader back="/profile" eyebrow="Lesson review" title="How was your lesson?" />
      <div className="space-y-4 text-center">
        <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#f1f0e6] text-[#9aa092]"><Check size={31} /></div>
        <p className="text-[12px] text-[#7b8377]">Reviews can only be left after a real lesson happens. No lessons have taken place, so this form is switched off to keep every review honest.</p>
        <div className="flex justify-center gap-1.5 opacity-40" aria-hidden>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={24} className="text-[#d49145]" />)}</div>
        <fieldset disabled className="space-y-3 opacity-60">
          <label className="sr-only" htmlFor="review">Review</label>
          <textarea id="review" placeholder="Your review" className="fh-input h-24 py-2" />
          <button type="button" className="fh-btn w-full">Submit review · unavailable</button>
        </fieldset>
        <Unavailable title="Tips and photo sharing are not connected">No money can be sent to cooks and no photos are uploaded.</Unavailable>
        <Link href="/cooks" className="fh-btn-2 w-full">Browse sample cooks</Link>
      </div>
    </div>
  );
}
