import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Check, CreditCard, Minus, Plus, Trash2, CalendarDays, Video } from 'lucide-react';
import type { FoodCatalog, FoodWorkspace } from '@workspace/api-client-react';
import { PageHeader, LoadingState, ErrorState, EmptyState, Unavailable } from '@/components/fh';
import { useFoodData, useSaveWorkspace, usePageMeta, money, fmtQty, prettyDateTime } from '@/lib/food';

function totals(catalog: FoodCatalog, ws: FoodWorkspace) {
  const courseLines = ws.basket.filter((b) => b.kind === 'course').map((b) => ({ b, c: catalog.courses.find((c) => c.id === b.referenceId) }));
  const subtotal = courseLines.reduce((s, l) => s + (l.c ? l.c.price * l.b.quantity : 0), 0);
  const voucher = catalog.vouchers.find((v) => v.code === ws.voucher);
  // FIRSTCOOK is a lesson offer, not a discount on course purchases.
  const discount = voucher?.code === 'LEARN15' ? Math.round(subtotal * voucher.percent) / 100 : 0;
  return { subtotal, voucher, discount, total: subtotal - discount };
}

export function CartPage() {
  usePageMeta('Cart', 'Your saved course and grocery basket.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const cur = catalog.currency;
  const t = totals(catalog, ws);
  const setQty = (id: string, q: number) => void save({ basket: ws.basket.map((b) => (b.id === id ? { ...b, quantity: q } : b)) });
  const remove = (id: string) => void save({ basket: ws.basket.filter((b) => b.id !== id) }, 'Removed from cart');
  const courses = ws.basket.filter((b) => b.kind === 'course');
  const groceries = ws.basket.filter((b) => b.kind === 'grocery');
  return (
    <div>
      <PageHeader back="/" eyebrow="A little of everything" title="Your cart" subtitle="Courses and grocery lines, saved together in your cooking workspace." />
      {ws.basket.length === 0 ? (
        <EmptyState title="Your cart is empty" body="Add a sample course, or send your grocery list here from the planner." action={<div className="flex gap-2"><Link href="/courses" className="fh-btn-2 px-4">Courses</Link><Link href="/planner" className="fh-btn-2 px-4">Planner</Link></div>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="rounded-[17px] bg-[#e9f0e4] p-3 text-[11px] font-bold text-[#315641]">COURSES · {courses.length} items</div>
            {courses.map((b) => {
              const c = catalog.courses.find((x) => x.id === b.referenceId);
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[#e7e5da] bg-[#fffdf7] p-3" data-testid={`row-basket-${b.id}`}>
                  <div className="min-w-0"><p className="text-[13px] font-extrabold">{c?.title ?? 'Course unavailable'}</p><p className="mt-1 text-[10px] text-[#7a8377]">{c ? `${c.lessons.length} lessons · sample course` : ''}</p></div>
                  <div className="flex items-center gap-2"><b className="text-[12px]">{c ? money(c.price, cur) : '-'}</b><button type="button" disabled={saving} onClick={() => remove(b.id)} aria-label={`Remove ${c?.title ?? 'item'}`} className="p-1 text-[#8a6a52]"><Trash2 size={14} /></button></div>
                </div>
              );
            })}
            <div className="rounded-[17px] bg-[#edf0e5] p-3 text-[10px] font-extrabold text-[#61705c]">GROCERIES · {groceries.length} lines · not priced</div>
            {groceries.map((b) => {
              const g = ws.groceries.find((x) => x.id === b.referenceId);
              return (
                <div key={b.id} className="flex items-center justify-between border-b border-[#e9e7dc] py-2" data-testid={`row-basket-${b.id}`}>
                  <div><p className="text-[12px] font-bold">{g?.name ?? 'Removed from grocery list'}</p><p className="text-[10px] text-[#81887c]">{g ? fmtQty(g.quantity, g.unit) : ''} · price unavailable</p></div>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="Decrease" disabled={saving || b.quantity <= 1} onClick={() => setQty(b.id, b.quantity - 1)} className="disabled:opacity-40"><Minus size={14} /></button>
                    <b className="text-[11px]">{b.quantity}</b>
                    <button type="button" aria-label="Increase" disabled={saving || b.quantity >= 50} onClick={() => setQty(b.id, b.quantity + 1)} className="disabled:opacity-40"><Plus size={14} /></button>
                    <button type="button" aria-label="Remove" disabled={saving} onClick={() => remove(b.id)} className="text-[#8a6a52]"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-3 lg:sticky lg:top-8 lg:self-start">
            <Link href="/vouchers" className="flex w-full justify-between rounded-[14px] bg-[#f4e8d4] p-3 text-[11px] font-bold text-[#674d34]">{t.voucher ? (t.voucher.code === 'LEARN15' ? `${t.voucher.code} · -${t.voucher.percent}% on courses` : `${t.voucher.code} · lesson offer saved`) : 'Add a voucher'} <span>Change</span></Link>
            <div className="rounded-[16px] bg-[#fffdf7] p-4 text-[12px]">
              <p className="flex justify-between py-1">Course subtotal <b>{money(t.subtotal, cur)}</b></p>
              <p className="flex justify-between py-1">Voucher <b>- {money(t.discount, cur)}</b></p>
              <p className="flex justify-between py-1">Groceries <b>Not priced</b></p>
              <p className="mt-2 flex justify-between border-t border-[#e8e6dc] pt-3 text-[15px] font-extrabold">Illustrative total <b>{money(t.total, cur)}</b></p>
            </div>
            <Link href="/checkout" className="fh-btn w-full" data-testid="link-checkout">Review checkout <ArrowRight size={14} /></Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function VouchersPage() {
  usePageMeta('Vouchers', 'Illustrative vouchers you can attach to your cart.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  const { save, saving } = useSaveWorkspace();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const apply = (c: string) => {
    const v = catalog.vouchers.find((x) => x.code.toUpperCase() === c.trim().toUpperCase());
    if (!v) { setErr('That code is not in the sample voucher list.'); return; }
    setErr('');
    void save({ voucher: v.code }, `${v.code} saved to your cart`);
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); if (!code.trim()) setErr('Enter a code.'); else apply(code); };
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back="/cart" eyebrow="Vouchers" title="A little something saved" subtitle="Illustrative offers. They change the cart estimate only; no real discount or payment exists." />
      <form onSubmit={onSubmit} noValidate className="flex rounded-full border border-[#e7e5da] bg-[#fffdf7] p-1">
        <label htmlFor="code" className="sr-only">Promo code</label>
        <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter promo code" aria-invalid={!!err} className="min-w-0 flex-1 bg-transparent px-3 text-[12px] outline-none" data-testid="input-voucher" />
        <button type="submit" disabled={saving} className="rounded-full bg-[#183328] px-4 py-2 text-[11px] font-extrabold text-white" data-testid="button-apply-voucher">Apply</button>
      </form>
      {err && <p className="fh-error px-3">{err}</p>}
      <div className="mt-4 space-y-3">
        {catalog.vouchers.map((v, i) => {
          const active = ws.voucher === v.code;
          return (
            <div key={v.code} className={`overflow-hidden rounded-[18px] border bg-[#fffdf7] ${active ? 'border-2 border-[#397552]' : 'border-[#e7e4d8]'}`}>
              <div className="flex items-center gap-3 p-4">
                <span className={`grid h-[60px] w-[72px] place-items-center rounded-[13px] px-2 text-center text-[13px] font-extrabold text-[#3b493b] ${i % 2 ? 'bg-[#f1e9d2]' : 'bg-[#f3dfd8]'}`}>{v.percent}% OFF</span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-extrabold">{v.title}</p><p className="mt-1 text-[10px] text-[#7b8378]">{v.description}</p><p className="mt-2 inline-block rounded-full border border-[#e6e4da] px-2.5 py-1 text-[10px] font-bold tracking-[.08em]">{v.code}</p></div>
                {active
                  ? <button type="button" disabled={saving} onClick={() => void save({ voucher: '' }, 'Voucher removed')} className="rounded-full bg-[#e8efe3] px-3 py-2 text-[10px] font-bold text-[#315641]" data-testid={`button-remove-voucher-${v.code}`}><Check size={11} className="mr-1 inline" />Saved · remove</button>
                  : <button type="button" disabled={saving} onClick={() => apply(v.code)} className="rounded-full bg-[#285c43] px-3 py-2 text-[10px] font-bold text-white" data-testid={`button-use-voucher-${v.code}`}>Use</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CheckoutPage() {
  usePageMeta('Checkout', 'Price breakdown. Payments are not connected.');
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const t = totals(catalog, ws);
  const cur = catalog.currency;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader back="/cart" eyebrow="Checkout · unavailable" title="Nearly around the table" subtitle="Here is exactly what your cart would cost. Payment and delivery are not connected, so nothing can be charged." />
      <div className="fh-card p-4 text-[12px]">
        {ws.basket.filter((b) => b.kind === 'course').map((b) => { const c = catalog.courses.find((x) => x.id === b.referenceId); return <p key={b.id} className="flex justify-between py-1">{c?.title ?? 'Unavailable course'} <b>{c ? money(c.price, cur) : '-'}</b></p>; })}
        <p className="mt-2 flex justify-between border-t border-[#eeece3] pt-2">Course subtotal <b>{money(t.subtotal, cur)}</b></p>
        <p className="flex justify-between py-1">Voucher {t.voucher ? `(${t.voucher.code}${t.voucher.code === 'FIRSTCOOK' ? ', lessons only' : `, ${t.voucher.percent}%`})` : ''} <b>- {money(t.discount, cur)}</b></p>
        <p className="flex justify-between py-1">Groceries ({ws.basket.filter((b) => b.kind === 'grocery').length} lines) <b>No prices available</b></p>
        <p className="flex justify-between py-1">Delivery <b>Not offered</b></p>
        <p className="flex justify-between py-1">Fees and tax <b>None calculated</b></p>
        <p className="mt-2 flex justify-between border-t border-[#e8e6dc] pt-3 text-[15px] font-extrabold">Illustrative total <b>{money(t.total, cur)}</b></p>
      </div>
      <button type="button" disabled className="fh-btn w-full" data-testid="button-pay"><CreditCard size={15} /> Pay · unavailable</button>
      <Unavailable title="Payments are not connected">No payment provider, wallet or cash-on-delivery service is linked. We won't collect card details or show a fake success. Your cart stays saved.</Unavailable>
      <Link href="/cart" className="fh-btn-2 w-full">Back to cart</Link>
    </div>
  );
}

export function ConfirmationPage() {
  usePageMeta('Request saved', 'Your lesson request draft was saved. It is not booked or paid.');
  const [, navigate] = useLocation();
  const { catalog, ws, isLoading, error, retry } = useFoodData();
  if (isLoading) return <LoadingState />;
  if (error || !catalog || !ws) return <ErrorState onRetry={retry} />;
  const rid = new URLSearchParams(window.location.search).get('request');
  const req = ws.lessonRequests.find((r) => r.id === rid) ?? ws.lessonRequests[ws.lessonRequests.length - 1];
  const cook = catalog.cooks.find((c) => c.id === req?.cookId);
  const recipe = catalog.recipes.find((r) => r.id === req?.recipeId);
  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <PageHeader back="/profile" eyebrow="Draft saved · not booked, not paid" title={req ? 'Request saved' : 'No request yet'} />
      {req ? (
        <>
          <div className="mx-auto grid h-[70px] w-[70px] place-items-center rounded-full bg-[#e4f0e3] text-[#34734b]"><Check size={31} /></div>
          <div className="space-y-3 rounded-[18px] bg-[#fffdf7] p-4 text-left">
            <div className="rounded-[14px] bg-[#e7f0e5] p-3"><p className="text-[10px] font-extrabold text-[#72806e]">YOUR LESSON DRAFT</p><p className="mt-1 text-[13px] font-bold">{recipe?.title ?? 'Lesson'} with {cook?.name ?? 'cook'}</p><p className="text-[11px] text-[#7e877b]">{prettyDateTime(req.startsAt)} · online · {req.packageSize} {req.packageSize === 1 ? 'lesson' : 'lessons'}</p></div>
            <div className="rounded-[14px] bg-[#f2ead9] p-3"><p className="text-[10px] font-extrabold text-[#806746]">ESTIMATE</p><p className="mt-1 text-[13px] font-bold">{money(req.total, req.currency)}</p><p className="text-[11px] text-[#7e877b]">Status: {req.status}. Nothing was charged.</p></div>
          </div>
          <Unavailable title="What happens next">Nothing, yet. The cook is a sample profile and is not notified. Calendar and video are not connected.</Unavailable>
          <button type="button" disabled className="fh-btn-2 w-full"><CalendarDays size={14} /> Add to calendar · unavailable</button>
          <Link href={`/lesson/${req.id}`} className="fh-btn w-full"><Video size={14} /> See lesson screen</Link>
        </>
      ) : <EmptyState title="No saved requests" body="Draft a lesson request from a sample cook profile." />}
      <button type="button" onClick={() => navigate('/')} className="w-full py-2 text-[12px] font-bold text-[#366549]">Back to home</button>
    </div>
  );
}
