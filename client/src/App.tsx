import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { UnderConstructionOverlay } from "@/components/UnderConstructionOverlay";
import { CookieConsent } from "@/components/CookieConsent";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Cookies from "@/pages/legal/Cookies";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ProfilePage from "@/pages/ProfilePage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import PasswordReset from "@/pages/PasswordReset";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/dashboard/Dashboard";
import DashboardAccount from "@/pages/dashboard/Account";
import DashboardProfiles from "@/pages/dashboard/Profiles";
import ProfileCreate from "@/pages/dashboard/ProfileCreate";
import ProfileEdit from "@/pages/dashboard/ProfileEdit";
import ProfilePayment from "@/pages/dashboard/ProfilePayment";
import PaymentStatus from "@/pages/dashboard/PaymentStatus";
import DashboardContacts from "@/pages/dashboard/Contacts";
import DashboardStatistics from "@/pages/dashboard/Statistics";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import Artikelen from "@/pages/Artikelen";
import Ervaringen from "@/pages/Ervaringen";
import DeTuinman from "@/pages/info/DeTuinman";
import GoedeTuinmanVinden from "@/pages/info/GoedeTuinmanVinden";
import HoeWerktTuinaanleg from "@/pages/info/HoeWerktTuinaanleg";
import TuinmanVsHovenier from "@/pages/info/TuinmanVsHovenier";
import KostenPrijzen from "@/pages/info/KostenPrijzen";
import VoorTuinmannen from "@/pages/info/VoorTuinmannen";
import NotFound from "@/pages/not-found";
import { siteConfig } from "@/lib/theme.config";

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

function Router() {
  return (
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
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/account" component={DashboardAccount} />
      <Route path="/dashboard/profielen" component={DashboardProfiles} />
      <Route path="/dashboard/profielen/nieuw" component={ProfileCreate} />
      <Route path="/dashboard/profielen/:id/bewerken" component={ProfileEdit} />
      <Route path="/dashboard/profielen/:id/betalen" component={ProfilePayment} />
      <Route path="/dashboard/profielen/:id/betaling-status" component={PaymentStatus} />
      <Route path="/dashboard/contacten" component={DashboardContacts} />
      <Route path="/dashboard/statistieken" component={DashboardStatistics} />
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
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <UnderConstructionOverlay />
            <Toaster />
            <Router />
            <CookieConsent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
