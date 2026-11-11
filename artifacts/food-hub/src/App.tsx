import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, useSearch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/fh';
import { useFoodData } from '@/lib/food';
import HomePage from '@/pages/home';
import ExplorePage from '@/pages/explore';
import RecipePage from '@/pages/recipe';
import CookModePage from '@/pages/cook-mode';
import PlannerPage from '@/pages/planner';
import BookingPage from '@/pages/booking';
import { CooksPage, CookProfilePage } from '@/pages/cooks';
import { LiveLessonPage, LessonCompletePage } from '@/pages/lessons';
import { CartPage, VouchersPage, CheckoutPage, ConfirmationPage } from '@/pages/commerce';
import { CoursesPage, ProfilePage, CookDashboardPage, BecomeCookPage, WelcomePage } from '@/pages/account';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

/** Loads the workspace on app start: the GET is what creates the guest cookie. */
function WorkspaceBoot() {
  useFoodData();
  return null;
}

function Router() {
  const [path] = useLocation();
  const search = useSearch();
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch key={`${path}?${search}`}>
          <Route path="/" component={HomePage} />
          <Route path="/welcome" component={WelcomePage} />
          <Route path="/explore" component={ExplorePage} />
          <Route path="/recipes/:id" component={RecipePage} />
          <Route path="/cook/:id" component={CookModePage} />
          <Route path="/planner" component={PlannerPage} />
          <Route path="/cooks" component={CooksPage} />
          <Route path="/cooks/:id" component={CookProfilePage} />
          <Route path="/book/:id" component={BookingPage} />
          <Route path="/lesson/:id" component={LiveLessonPage} />
          <Route path="/lesson-complete" component={LessonCompletePage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/vouchers" component={VouchersPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/confirmation" component={ConfirmationPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/cook-dashboard" component={CookDashboardPage} />
          <Route path="/become-a-cook" component={BecomeCookPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WorkspaceBoot />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
