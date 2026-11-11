import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  ChefHat,
  ChevronRight,
  Clock3,
  Check,
  GraduationCap,
  Heart,
  Home,
  Info,
  Leaf,
  RotateCw,
  Search,
  ShoppingBasket,
  Ticket,
  Utensils,
  Lock,
} from 'lucide-react';
import type { FoodRecipe } from '@workspace/api-client-react';
import { imgSrc } from '@/lib/food';

const tabs = [
  { label: 'Home', href: '/', icon: Home, match: (p: string) => p === '/' },
  { label: 'Explore', href: '/explore', icon: Search, match: (p: string) => p.startsWith('/explore') || p.startsWith('/recipes') },
  { label: 'Cooks', href: '/cooks', icon: ChefHat, match: (p: string) => p.startsWith('/cooks') || p.startsWith('/book') || p.startsWith('/lesson') },
  { label: 'Planner', href: '/planner', icon: Check, match: (p: string) => p.startsWith('/planner') },
  { label: 'Profile', href: '/profile', icon: Heart, match: (p: string) => p.startsWith('/profile') || p.startsWith('/cook-dashboard') || p.startsWith('/become-a-cook') },
];

const more = [
  { label: 'Courses', href: '/courses', icon: GraduationCap },
  { label: 'Cart', href: '/cart', icon: ShoppingBasket },
  { label: 'Vouchers', href: '/vouchers', icon: Ticket },
  { label: 'Teach on Food Hub', href: '/become-a-cook', icon: Utensils },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#285c43] text-[#f8f1df] shadow-[0_5px_12px_rgba(40,92,67,.16)]">
        <Utensils size={19} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block font-display text-[19px] font-extrabold leading-[1.05] tracking-[-.8px] text-[#234a36]">food hub</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.14em] text-[#859082]">A taste of home</span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const immersive = location.startsWith('/cook/');
  if (immersive) return <>{children}<PhotoCreditsLink /></>;
  return (
    <div className="min-h-[100dvh] bg-[#fbf7ed] text-[#25362b]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top_right,rgba(231,239,226,.9),transparent_72%)]" />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#e6e5d9] bg-[#fffdf7]/90 px-5 py-6 backdrop-blur md:flex">
        <Logo />
        <nav aria-label="Main" className="mt-8 space-y-1">
          {tabs.map((t) => {
            const active = t.match(location);
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} data-testid={`nav-${t.label.toLowerCase()}`}
                className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] transition-colors ${active ? 'bg-[#e8efe3] font-extrabold text-[#285c43]' : 'font-semibold text-[#6f786c] hover:bg-[#f3f2e8]'}`}>
                <Icon size={18} /> {t.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-8 px-3 fh-eyebrow">More</p>
        <nav aria-label="More" className="mt-2 space-y-1">
          {more.map((t) => {
            const Icon = t.icon;
            const active = location.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} data-testid={`nav-more-${t.href.slice(1)}`}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[12px] ${active ? 'bg-[#f3e8d7] font-extrabold text-[#6b553d]' : 'font-semibold text-[#7a8377] hover:bg-[#f3f2e8]'}`}>
                <Icon size={16} /> {t.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto rounded-[14px] bg-[#f3f2e8] p-3 text-[10px] leading-[1.5] text-[#7b8377]">
          Guest workspace saved in this browser only. Clearing cookies removes access to it.
        </p>
      </aside>
      <div className="relative md:pl-64">
        <main className="mx-auto w-full max-w-[1080px] px-5 pb-28 pt-4 md:px-10 md:pb-16 md:pt-8">{children}<PhotoCreditsLink /></main>
      </div>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e6e5d9] bg-[#fffdf7]/95 px-2 pb-[max(9px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="flex items-center justify-around">
          {tabs.map((t) => {
            const active = t.match(location);
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} data-testid={`tab-${t.label.toLowerCase()}`}
                className={`flex min-w-[54px] flex-col items-center gap-1 py-1 ${active ? 'text-[#285c43]' : 'text-[#9a9d90]'}`}>
                <span className={`grid h-7 w-10 place-items-center rounded-full ${active ? 'bg-[#e8efe3]' : ''}`}><Icon size={18} /></span>
                <span className={`text-[10px] ${active ? 'font-extrabold' : 'font-semibold'}`}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function PhotoCreditsLink() {
  return <footer className="px-5 py-6 text-center text-[11px] text-[#596953]">
    <a href={`${import.meta.env.BASE_URL}photo-credits.html`} className="underline underline-offset-4">Food photography credits &amp; licenses</a>
  </footer>;
}

export function BackButton({ fallback = '/', dark = false }: { fallback?: string; dark?: boolean }) {
  const [, navigate] = useLocation();
  return (
    <button type="button" aria-label="Go back" data-testid="button-back"
      onClick={() => (window.history.length > 1 ? window.history.back() : navigate(fallback))}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${dark ? 'bg-[#2c4032] text-white' : 'border border-[#eae8dc] bg-[#fffdf7] text-[#345d42]'}`}>
      <ArrowLeft size={17} />
    </button>
  );
}

export function PageHeader({ eyebrow, title, subtitle, back, action }: { eyebrow: string; title: string; subtitle?: string; back?: string; action?: ReactNode }) {
  return (
    <header className="fh-fade-up pb-5">
      <div className="flex items-center justify-between gap-3">
        {back ? <BackButton fallback={back} /> : <span className="md:hidden"><Logo /></span>}
        {action}
      </div>
      <p className="fh-eyebrow mt-5">{eyebrow}</p>
      <h1 className="mt-1 font-display text-[27px] font-extrabold leading-[1.1] tracking-[-1px] text-[#26392d] md:text-[34px]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-[60ch] text-[13px] leading-[1.6] text-[#788276]">{subtitle}</p>}
    </header>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-4 pt-4">
      <div className="h-6 w-40 animate-pulse rounded-full bg-[#ecebdf]" />
      <div className="h-9 w-72 max-w-full animate-pulse rounded-[12px] bg-[#ecebdf]" />
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-[20px] border border-[#e9e7db] bg-[#fffdf7]">
            <div className="h-[145px] animate-pulse bg-[#ecebdf]" />
            <div className="space-y-2 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-[#ecebdf]" /><div className="h-3 w-1/2 animate-pulse rounded bg-[#f1f0e6]" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md rounded-[20px] border border-[#ecd8cf] bg-[#fffdf7] p-6 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f6e3db] text-[#a2533a]"><AlertTriangle size={20} /></span>
      <p className="mt-3 font-display text-[17px] font-extrabold">The kitchen didn't answer</p>
      <p className="mt-1 text-[12px] leading-[1.6] text-[#7b8377]">{message ?? 'We could not load this page. Check your connection and try again.'}</p>
      {onRetry && <button type="button" onClick={onRetry} className="fh-btn mx-auto mt-4 w-auto px-6" data-testid="button-retry"><RotateCw size={15} /> Try again</button>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#d9dfd2] bg-[#f5f4e9] px-5 py-8 text-center">
      <Leaf size={20} className="mx-auto text-[#5b795f]" />
      <p className="mt-2 text-[14px] font-bold text-[#33483a]">{title}</p>
      <p className="mx-auto mt-1 max-w-[42ch] text-[12px] text-[#7c8678]">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function NotFoundInline({ what, back }: { what: string; back: string }) {
  return (
    <div className="pt-6">
      <BackButton fallback={back} />
      <div className="mt-6"><EmptyState title={`${what} not found`} body="This link may be out of date." action={<Link href={back} className="fh-btn-2 px-5">Go back</Link>} /></div>
    </div>
  );
}

/** Honest notice for integrations that are not connected. */
export function Unavailable({ title, children, tone = 'sand' }: { title: string; children: ReactNode; tone?: 'sand' | 'leaf' }) {
  return (
    <div role="note" className={`flex gap-3 rounded-[15px] border p-3.5 ${tone === 'sand' ? 'border-[#ecdfc9] bg-[#f6eedd]' : 'border-[#dbe5d5] bg-[#eaf0e4]'}`}>
      <span className="mt-0.5 shrink-0 text-[#7a5e3f]">{tone === 'sand' ? <Lock size={15} /> : <Info size={15} />}</span>
      <div>
        <p className="text-[12px] font-extrabold text-[#4b3d2a]">{title}</p>
        <div className="mt-1 text-[11px] leading-[1.55] text-[#6f6a5b]">{children}</div>
      </div>
    </div>
  );
}

export function SampleBadge({ className = '' }: { className?: string }) {
  return <span className={`rounded-full bg-[#f3e8d7] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#7a5e3f] ${className}`}>Sample</span>;
}

export function Initials({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const ini = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full border-[3px] border-[#f2dfc8] bg-[#e9c3a0] font-display font-extrabold text-[#65462f] ${size === 'lg' ? 'h-16 w-16 text-[18px]' : 'h-14 w-14 text-[16px]'}`}>{ini}</span>
  );
}

export function RecipeCard({ recipe, saved, onToggleSave, saving, wide = false, index = 0 }: { recipe: FoodRecipe; saved?: boolean; onToggleSave?: () => void; saving?: boolean; wide?: boolean; index?: number }) {
  return (
    <article className={`fh-recipe-card fh-fade-up overflow-hidden rounded-[20px] border border-[#e9e7db] bg-[#fffdf7] shadow-[0_6px_16px_rgba(48,64,47,.07)] ${wide ? 'w-full' : 'w-[280px] shrink-0 snap-start md:w-auto'}`} style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-recipe-${recipe.id}`}>
      <div className="relative h-[160px] overflow-hidden">
        <Link href={`/recipes/${recipe.id}`} aria-label={`Open ${recipe.title}`} className="block h-full">
          <img src={imgSrc(recipe.image)} alt={recipe.title} className="fh-recipe-photo h-full w-full object-cover" />
        </Link>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#fffdf0]/95 px-2.5 py-1 text-[10px] font-extrabold text-[#39563e]">{recipe.category}{recipe.vegetarian ? ' · Vegetarian' : ''}</span>
        {onToggleSave && (
          <button type="button" disabled={saving} onClick={onToggleSave} aria-pressed={!!saved} aria-label={saved ? `Unsave ${recipe.title}` : `Save ${recipe.title}`} data-testid={`button-save-${recipe.id}`}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#fffdf0]/95 text-[#315b40] disabled:opacity-60">
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#25392d]/85 px-2.5 py-1 text-[10px] font-semibold text-white"><Clock3 size={11} /> {recipe.minutes} min</span>
      </div>
      <Link href={`/recipes/${recipe.id}`} className="flex w-full items-center justify-between px-3.5 py-3 text-left">
        <span className="min-w-0">
          <span className="block font-display text-[16px] font-extrabold leading-tight tracking-[-.45px] text-[#26392d]">{recipe.title}</span>
          <span className="mt-1 block truncate text-[11px] font-medium text-[#7b8477]">{recipe.subtitle}</span>
        </span>
        <span className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf2e8] text-[#376247]"><ChevronRight size={16} /></span>
      </Link>
    </article>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-[#f1f0e6] text-[#315641] disabled:opacity-40">-</button>
      <span className="min-w-[2ch] text-center text-[13px] font-extrabold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-full bg-[#f1f0e6] text-[#315641] disabled:opacity-40">+</button>
    </div>
  );
}
