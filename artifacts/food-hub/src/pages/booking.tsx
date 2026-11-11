import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Video, Home as HomeIcon, Trash2 } from 'lucide-react';
import { useCreateLessonRequest, useDeleteLessonRequest, getGetFoodWorkspaceQueryKey, getGetFoodSummaryQueryKey } from '@workspace/api-client-react';
import { PageHeader, LoadingState, ErrorState, NotFoundInline, Unavailable } from '@/components/fh';
import { useFoodData, usePageMeta, money, todayISO, errMessage, prettyDateTime } from '@/lib/food';
import { useToast } from '@/hooks/use-toast';

const TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00'];

export function useRemoveLessonRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteLessonRequest();
  const remove = (id: string) => del.mutate({ id }, {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: getGetFoodWorkspaceQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetFoodSummaryQueryKey() });
      toast({ title: 'Lesson draft deleted' });
    },
    onError: (e) => toast({ title: 'Not deleted', description: errMessage(e), variant: 'destructive' }),
  });
  return { remove, pending: del.isPending };
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const cook = catalog?.cooks.find((c) => c.id === id);
  usePageMeta(cook ? `Lesson request with ${cook.name}` : 'Lesson request', 'Save a draft online lesson request. No reservation or payment is made.');
  const create = useCreateLessonRequest();
  const { remove, pending } = useRemoveLessonRequest();
  const [recipeId, setRecipeId] = useState('');
  const [date, setDate] = useState(todayISO(1));
  const [time, setTime] = useState('');
  const [pkg, setPkg] = useState<1 | 5>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState label="Loading" />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  if (!cook) return <NotFoundInline what="Cook" back="/cooks" />;
  const dishes = catalog.recipes.filter((r) => cook.dishes.includes(r.id));
  const mine = ws.lessonRequests.filter((r) => r.cookId === cook.id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!recipeId) errs.recipe = 'Choose a dish to learn.';
    if (!time) errs.time = 'Choose a time.';
    const starts = new Date(`${date}T${time || '00:00'}:00`);
    const now = Date.now();
    if (Number.isNaN(starts.getTime())) errs.date = 'Choose a valid date.';
    else if (time && starts.getTime() < now + 60_000) errs.date = 'Pick a time in the future.';
    else if (starts.getTime() > now + 365 * 86400_000) errs.date = 'Pick a date within the next year.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    create.mutate({ data: { cookId: cook.id, recipeId, startsAt: starts.toISOString(), format: 'online', packageSize: pkg } }, {
      onSuccess: (req) => {
        void qc.invalidateQueries({ queryKey: getGetFoodWorkspaceQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetFoodSummaryQueryKey() });
        navigate(`/confirmation?request=${encodeURIComponent(req.id)}`);
      },
    });
  };

  return (
    <div>
      <PageHeader back={`/cooks/${cook.id}`} eyebrow={`Lesson request · ${cook.name}`} title="Make time to learn" subtitle="Save a draft request in your guest workspace. Nothing is reserved, sent to the cook, or paid." />
      <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[16px] border-2 border-[#397552] bg-[#e8f0e5] p-3"><span className="flex items-center gap-1 text-[13px] font-extrabold"><Video size={14} /> Online video</span><span className="mt-1 block text-[10px] text-[#778176]">Cook along from anywhere</span></div>
            <div className="rounded-[16px] border border-[#e4e4d8] bg-[#f3f2e8] p-3 text-[#8a8f84]" aria-disabled="true"><span className="flex items-center gap-1 text-[13px] font-extrabold"><HomeIcon size={14} /> Home visit</span><span className="mt-1 block text-[10px]">Unavailable: we cannot verify that you and the cook share a location.</span></div>
          </div>
          <label className="fh-label">Dish
            <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="fh-input mt-1.5" aria-invalid={!!errors.recipe} data-testid="select-dish"><option value="">Choose a dish</option>{dishes.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
            {errors.recipe && <p className="fh-error">{errors.recipe}</p>}
          </label>
          <label className="fh-label">Date
            <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="fh-input mt-1.5" aria-invalid={!!errors.date} data-testid="input-date" />
            {errors.date && <p className="fh-error">{errors.date}</p>}
          </label>
          <fieldset>
            <legend className="fh-label">Time <span className="font-medium text-[#7b8377]">(your local time)</span></legend>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {TIMES.map((t) => <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} data-testid={`button-time-${t}`} className={`rounded-[12px] border py-2.5 text-[11px] font-bold ${time === t ? 'border-[#397552] bg-[#e7f0e5] text-[#315641]' : 'border-[#e5e4d8] bg-[#fffdf7]'}`}>{t}</button>)}
            </div>
            {errors.time && <p className="fh-error">{errors.time}</p>}
          </fieldset>
          <button type="button" role="checkbox" aria-checked={pkg === 5} onClick={() => setPkg(pkg === 5 ? 1 : 5)} className={`flex w-full items-center gap-3 rounded-[15px] p-3 text-left ${pkg === 5 ? 'bg-[#e6efe2]' : 'bg-[#f5ecd7]'}`} data-testid="checkbox-package">
            <span className={`grid h-5 w-5 place-items-center rounded border ${pkg === 5 ? 'border-[#397552] bg-[#397552] text-white' : 'border-[#bdc3ae]'}`}>{pkg === 5 && <Check size={12} />}</span>
            <span><b className="block text-[12px]">Make it a 5-lesson package</b><small className="text-[10px] text-[#778075]">The draft total is calculated by the server</small></span>
          </button>
        </div>
        <div className="space-y-3 lg:sticky lg:top-8 lg:self-start">
          <div className="fh-card p-4 text-[12px]"><p className="flex justify-between">Rate <b>{money(cook.hourlyRate, cook.currency)} / hr</b></p><p className="mt-1 flex justify-between">Lessons <b>{pkg}</b></p></div>
          {create.isError && <p role="alert" className="rounded-[12px] bg-[#f6e3db] p-3 text-[12px] text-[#8a3f2a]">{errMessage(create.error)}</p>}
          <button type="submit" disabled={create.isPending} className="fh-btn w-full" data-testid="button-save-draft">{create.isPending ? 'Saving...' : <>Save draft request <ArrowRight size={14} /></>}</button>
          <Unavailable title="This is not a booking">Scheduling, payments and messaging cooks are not connected. Your draft only lives in this browser's guest workspace.</Unavailable>
          {mine.length > 0 && (
            <div className="fh-card p-4">
              <p className="text-[12px] font-extrabold">Your drafts with {cook.name}</p>
              {mine.map((r) => (
                <div key={r.id} className="mt-2 flex items-center justify-between border-t border-[#eeece3] pt-2 text-[11px]">
                  <span>{prettyDateTime(r.startsAt)} · {money(r.total, r.currency)}</span>
                  <button type="button" disabled={pending} onClick={() => remove(r.id)} aria-label="Delete draft" className="p-1 text-[#8a6a52]"><Trash2 size={14} /></button>
                </div>
              ))}
              <Link href="/profile" className="mt-2 block text-[11px] font-bold text-[#39664c]">See all drafts</Link>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
