import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { CookieConsent } from "@/components/CookieConsent";
import { SpeedInsights } from "@vercel/speed-insights/react";
// Eagerly bundled: top-of-funnel + auth pages so the first paint after a
// Google landing is instant. Everything else is lazy-loaded so the initial
// JS bundle stays small and the homepage can render before secondary
// chunks arrive.
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ProfilePage from "@/pages/ProfilePage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import { siteConfig } from "@/lib/theme.config";

// Lazy-loaded routes — split into their own chunks so they don't bloat the
// initial bundle. Each chunk fetches on first navigation and is cached.
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const PasswordReset = lazy(() => import("@/pages/PasswordReset"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const DashboardAccount = lazy(() => import("@/pages/dashboard/Account"));
const DashboardProfiles = lazy(() => import("@/pages/dashboard/Profiles"));
const ProfileCreate = lazy(() => import("@/pages/dashboard/ProfileCreate"));
const ProfileEdit = lazy(() => import("@/pages/dashboard/ProfileEdit"));
const ProfilePayment = lazy(() => import("@/pages/dashboard/ProfilePayment"));
const PaymentStatus = lazy(() => import("@/pages/dashboard/PaymentStatus"));
const DashboardContacts = lazy(() => import("@/pages/dashboard/Contacts"));
const DashboardStatistics = lazy(() => import("@/pages/dashboard/Statistics"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Artikelen = lazy(() => import("@/pages/Artikelen"));
const Ervaringen = lazy(() => import("@/pages/Ervaringen"));
const DeTuinman = lazy(() => import("@/pages/info/DeTuinman"));
const GoedeTuinmanVinden = lazy(() => import("@/pages/info/GoedeTuinmanVinden"));
const HoeWerktTuinaanleg = lazy(() => import("@/pages/info/HoeWerktTuinaanleg"));
const TuinmanVsHovenier = lazy(() => import("@/pages/info/TuinmanVsHovenier"));
const KostenPrijzen = lazy(() => import("@/pages/info/KostenPrijzen"));
const VoorTuinmannen = lazy(() => import("@/pages/info/VoorTuinmannen"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Cookies = lazy(() => import("@/pages/legal/Cookies"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProfiles = lazy(() => import("@/pages/admin/AdminProfiles"));
const AdminProfileDetail = lazy(() => import("@/pages/admin/AdminProfileDetail"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminCatalogs = lazy(() => import("@/pages/admin/AdminCatalogs"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

// Info-page registry: maps each info-route slot to its concrete component.
// Paths are sourced from siteConfig.infoRoutes so a rebrand only edits
// theme.config.ts — App.tsx never needs to change.
const INFO_ROUTE_COMPONENTS: Record<keyof typeof siteConfig.infoRoutes, React.ComponentType<any>> = {
  aboutBusiness: DeTuinman,
  findGoodBusiness: GoedeTuinmanVinden,
  pricing: KostenPrijzen,
  forBusinesses: VoorTuinmannen,
};

// Static info pages with no slot in siteConfig.infoRoutes (vertical-specific
// supplementary content). These keep their hard-coded paths because they are
// optional extras that ship per-vertical.
const EXTRA_INFO_ROUTES: { path: string; component: React.ComponentType<any> }[] = [
  { path: "/info/hoe-werkt-tuinaanleg", component: HoeWerktTuinaanleg },
  { path: "/info/tuinman-vs-hovenier", component: TuinmanVsHovenier },
];

// Suspense fallback while a lazy chunk loads. Intentionally bare — most
// chunks load in <100ms over a warm cache, so a heavy skeleton would cause
// more flicker than it prevents.
function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        {/* New URL structure: /zoek/{postcode-city}/{specialization} */}
        <Route path="/zoek" component={CategoryPage} />
        <Route path="/zoek/:locationOrSpec/:specialization" component={CategoryPage} />
        <Route path="/zoek/:locationOrSpec" component={CategoryPage} />
        <Route path="/bedrijf/:slug" component={ProfilePage} />
        <Route path="/login" component={Login} />
        <Route path="/registreren" component={Register} />
        <Route path="/wachtwoord-vergeten" component={ForgotPassword} />
        <Route path="/wachtwoord-reset" component={PasswordReset} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/account" component={DashboardAccount} />
        <Route path="/dashboard/profielen" component={DashboardProfiles} />
        <Route path="/dashboard/profielen/nieuw" component={ProfileCreate} />
        <Route path="/dashboard/profielen/:id/bewerken" component={ProfileEdit} />
        <Route path="/dashboard/profielen/:id/betalen" component={ProfilePayment} />
        <Route path="/dashboard/profielen/:id/betaling-status" component={PaymentStatus} />
        <Route path="/dashboard/contacten" component={DashboardContacts} />
        <Route path="/dashboard/statistieken" component={DashboardStatistics} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/profielen" component={AdminProfiles} />
        <Route path="/admin/profielen/:id" component={AdminProfileDetail} />
        <Route path="/admin/gebruikers" component={AdminUsers} />
        <Route path="/admin/catalogi" component={AdminCatalogs} />
        <Route path="/admin/abonnementen" component={AdminSubscriptions} />
        <Route path="/admin/betalingen" component={AdminPayments} />
        <Route path="/admin/instellingen" component={AdminSettings} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
        <Route path="/over-ons" component={About} />
        <Route path="/prijzen" component={Pricing} />
        <Route path="/artikelen" component={Artikelen} />
        <Route path="/ervaringen" component={Ervaringen} />
        {(Object.entries(siteConfig.infoRoutes) as [keyof typeof siteConfig.infoRoutes, string][]).map(
          ([slot, path]) => (
            <Route key={slot} path={path} component={INFO_ROUTE_COMPONENTS[slot]} />
          )
        )}
        {EXTRA_INFO_ROUTES.map(({ path, component }) => (
          <Route key={path} path={path} component={component} />
        ))}
        <Route path="/privacy" component={Privacy} />
        <Route path="/algemene-voorwaarden" component={Terms} />
        <Route path="/cookies" component={Cookies} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <CookieConsent />
            <SpeedInsights />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
