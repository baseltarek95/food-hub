import { type ReactNode, useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Link, useLocation } from 'wouter';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { getGetFoodWorkspaceQueryKey, getGetFoodSummaryQueryKey, useImportFoodGuest } from '@workspace/api-client-react';
import { useFoodData, errMessage } from '@/lib/food';
import { usePageMeta } from '@/lib/food';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

export function FoodAuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    signInFallbackRedirectUrl={`${basePath}/profile`}
    signUpFallbackRedirectUrl={`${basePath}/profile`}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    appearance={{
      theme: shadcn,
      cssLayerName: 'clerk',
      options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
      variables: {
        colorPrimary: '#285c43', colorForeground: '#25362b', colorMutedForeground: '#596953',
        colorDanger: '#983f2b', colorBackground: '#fffdf7', colorInput: '#ffffff',
        colorInputForeground: '#25362b', colorNeutral: '#25362b',
        fontFamily: 'DM Sans, sans-serif', borderRadius: '14px',
      },
      elements: {
        rootBox: 'w-full flex justify-center',
        cardBox: 'bg-[#fffdf7] rounded-2xl w-[440px] max-w-full overflow-hidden',
        card: '!shadow-none !border-0 !bg-transparent !rounded-none',
        footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
        headerTitle: 'text-[#25362b]', headerSubtitle: 'text-[#596953]',
        socialButtonsBlockButtonText: 'text-[#25362b]', formFieldLabel: 'text-[#25362b]',
        footerActionLink: 'text-[#285c43]', footerActionText: 'text-[#596953]',
        dividerText: 'text-[#596953]', identityPreviewEditButton: 'text-[#285c43]',
        formFieldSuccessText: 'text-[#285c43]', alertText: 'text-[#983f2b]',
        formButtonPrimary: '!text-white',
      },
    }}
    localization={{
      signIn: { start: { title: 'Welcome back to Food Hub', subtitle: 'Sign in to your kitchen on any device' } },
      signUp: { start: { title: 'Your kitchen, everywhere', subtitle: 'Create an account to keep your recipes and plans' } },
    }}
  >{children}</ClerkProvider>;
}

export function AuthPage({ signup = false }: { signup?: boolean }) {
  usePageMeta(signup ? 'Create account' : 'Sign in', 'Keep your Food Hub recipes and plans safely across devices.');
  return <div className="mx-auto max-w-lg py-8">
    <p className="mb-5 text-center text-[13px] text-[#596953]">Your browser workspace stays safe. After sign-in, choose whether to import it into this account.</p>
    {signup
      ? <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      : <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />}
    <Link href="/" className="mt-5 block text-center text-[12px] font-bold text-[#285c43]">Continue browsing</Link>
  </div>;
}

export function AccountControls() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const pending = useIsMutating() > 0;
  const [error, setError] = useState('');
  if (!user) return <div className="fh-card space-y-3 p-4">
    <p className="text-[13px] font-bold">Keep your kitchen across devices</p>
    <p className="text-[12px] text-[#596953]">Sign in, then choose to import this browser's recipes, plans and drafts.</p>
    <div className="flex gap-2"><Link href="/sign-in" className="fh-btn px-5" data-testid="button-sign-in">Sign in</Link><Link href="/sign-up" className="fh-btn-2 px-5">Create account</Link></div>
  </div>;
  return <div className="fh-card space-y-2 p-4">
    <p className="text-[12px] text-[#596953]">Signed in as <b>{user.primaryEmailAddress?.emailAddress ?? user.fullName ?? 'Food Hub member'}</b></p>
    <button className="fh-btn-2 px-5" disabled={pending} onClick={async () => {
      setError('');
      try { await signOut({ redirectUrl: basePath || '/' }); }
      catch { setError('Could not sign out. Please try again.'); }
    }} data-testid="button-sign-out">Sign out</button>
    {pending && <p className="text-[11px]">Wait for your save to finish before signing out.</p>}
    {error && <p role="alert" className="fh-error">{error}</p>}
  </div>;
}

/** No automatic claiming: imports require an explicit click in the signed-in account. */
export function GuestImportNotice() {
  const { ws } = useFoodData();
  const { user } = useUser();
  const mutation = useImportFoodGuest();
  const qc = useQueryClient();
  const pending = useIsMutating() > 0;
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState(false);
  if (!user || !ws?.guestImportAvailable || hidden) return null;
  return <section className="mb-5 space-y-3 rounded-[18px] border border-[#c7d8bf] bg-[#e8efe4] p-4" aria-label="Import browser workspace">
    <h2 className="text-[14px] font-extrabold">Keep this browser's kitchen?</h2>
    <p className="text-[12px] leading-5">Import its saved recipes, meal plans, groceries, cart, course progress and drafts into <b>{user.primaryEmailAddress?.emailAddress ?? 'this account'}</b>. Existing account items are kept. Nothing moves until you choose Import.</p>
    <div className="flex flex-wrap gap-2">
      <button className="fh-btn px-4" disabled={pending} data-testid="button-import-guest" onClick={async () => {
        setError('');
        try {
          const next = await mutation.mutateAsync();
          qc.setQueryData(getGetFoodWorkspaceQueryKey(), next);
          await qc.invalidateQueries({ queryKey: getGetFoodSummaryQueryKey() });
        } catch (e) { setError(errMessage(e)); }
      }}>{mutation.isPending ? 'Importing...' : 'Import browser workspace'}</button>
      <button className="fh-btn-2 px-4" disabled={pending} onClick={() => setHidden(true)}>Not now</button>
    </div>
    <p className="text-[11px] text-[#596953]">Not now keeps the browser kitchen separate. Sign out to use it, or reload to import later. After import, it belongs only to this account.</p>
    {error && <p role="alert" className="fh-error">{error}</p>}
  </section>;
}

export function AuthReady({ children }: { children: (identity: string) => ReactNode }) {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return <p className="p-8 text-center text-[#285c43]" role="status">Opening your kitchen...</p>;
  return children(userId ?? 'guest');
}
