import { useEffect } from 'react';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import {
  useGetFoodCatalog,
  getGetFoodCatalogQueryKey,
  useGetFoodWorkspace,
  getGetFoodWorkspaceQueryKey,
  getGetFoodSummaryQueryKey,
  useGetFoodSummary,
  useUpdateFoodWorkspace,
  getUpdateFoodWorkspaceMutationKey,
  type FoodRecipe,
  type GroceryItem,
  type Ingredient,
  type PlanEntry,
  type WorkspaceInput,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL;

export function imgSrc(image: string | undefined | null): string {
  if (!image) return `${BASE}images/food-hub/molokhia.jpg`;
  if (/^https?:\/\//.test(image)) return image;
  const file = image.split('/').pop() ?? image;
  return `${BASE}images/food-hub/${file}`;
}

export function money(amount: number, currency = 'EGP'): string {
  return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`.slice(0, 80);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function scaleQty(qty: number, from: number, to: number): number {
  if (!from) return qty;
  return Math.max(0.01, round2((qty * to) / from));
}

export function fmtQty(q: number, unit: string): string {
  const n = Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/\.?0+$/, '');
  return unit ? `${n} ${unit}` : n;
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function prettyDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function prettyDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const key = (name: string, unit: string) => `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;

/** Merge ingredients into an existing grocery list, summing matching name+unit lines. */
export function mergeGroceries(existing: GroceryItem[], incoming: Ingredient[]): GroceryItem[] {
  const out = existing.map((g) => ({ ...g }));
  for (const ing of incoming) {
    const found = out.find((g) => !g.checked && key(g.name, g.unit) === key(ing.name, ing.unit));
    if (found) found.quantity = Math.min(100000, round2(found.quantity + ing.quantity));
    else out.push({ id: uid('g'), name: ing.name.slice(0, 100), quantity: Math.max(0.01, round2(ing.quantity)), unit: ing.unit.slice(0, 30), checked: false });
  }
  return out.slice(0, 300);
}

/** Aggregate ingredients for every planned meal, scaled to that meal's servings. */
export function aggregatePlan(plan: PlanEntry[], recipes: FoodRecipe[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const entry of plan) {
    const r = recipes.find((x) => x.id === entry.recipeId);
    if (!r) continue;
    for (const ing of r.ingredients) {
      const k = key(ing.name, ing.unit);
      const q = scaleQty(ing.quantity, r.servings, entry.servings);
      const cur = map.get(k);
      if (cur) cur.quantity = round2(cur.quantity + q);
      else map.set(k, { name: ing.name, unit: ing.unit, quantity: q });
    }
  }
  return Array.from(map.values());
}

export function errMessage(e: unknown): string {
  if (e && typeof e === 'object') {
    const anyE = e as { message?: unknown; data?: { error?: unknown; message?: unknown } };
    if (anyE.data && typeof anyE.data.error === 'string') return anyE.data.error;
    if (anyE.data && typeof anyE.data.message === 'string') return anyE.data.message;
    if (typeof anyE.message === 'string') return anyE.message;
  }
  return 'Something went wrong. Please try again.';
}

export function useFoodData() {
  const catalog = useGetFoodCatalog({ query: { queryKey: getGetFoodCatalogQueryKey(), staleTime: 5 * 60_000 } });
  const workspace = useGetFoodWorkspace({ query: { queryKey: getGetFoodWorkspaceQueryKey() } });
  return {
    catalog: catalog.data,
    ws: workspace.data,
    isLoading: catalog.isLoading || workspace.isLoading,
    error: catalog.error ?? workspace.error,
    retry: () => {
      void catalog.refetch();
      void workspace.refetch();
    },
  };
}

/**
 * Save only the changed workspace section(s). Awaits the server, writes the returned
 * workspace into the cache, refreshes the summary. Blocks concurrent writes.
 */
export function useSaveWorkspace() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateFoodWorkspace();
  const pendingCount = useIsMutating({ mutationKey: getUpdateFoodWorkspaceMutationKey() });
  const saving = pendingCount > 0;

  async function save(data: WorkspaceInput, successMessage?: string): Promise<boolean> {
    if (qc.isMutating({ mutationKey: getUpdateFoodWorkspaceMutationKey() }) > 0) {
      toast({ title: 'Still saving', description: 'Please wait for the previous change to finish.' });
      return false;
    }
    try {
      const next = await mutation.mutateAsync({ data });
      qc.setQueryData(getGetFoodWorkspaceQueryKey(), next);
      void qc.invalidateQueries({ queryKey: getGetFoodSummaryQueryKey() });
      if (successMessage) toast({ title: successMessage });
      return true;
    } catch (e) {
      toast({ title: 'Not saved', description: errMessage(e), variant: 'destructive' });
      return false;
    }
  }

  return { save, saving };
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} · Food Hub`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
}

export function useSummary() {
  const { ws } = useFoodData();
  return useGetFoodSummary({ query: { queryKey: getGetFoodSummaryQueryKey(), enabled: !!ws } });
}
