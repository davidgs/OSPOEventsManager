import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { withAuthProtection } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Header } from "@/components/layout/Header";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import EventsPage from "@/pages/events/index";
import EventDetailsPage from "@/pages/events/details";
import ProfilePage from "@/pages/profile";
import CfpSubmissionsPage from "@/pages/cfp-submissions/index";
import AttendeesPage from "@/pages/attendees/index";
import SponsorshipsPage from "@/pages/sponsorships/index";
import DashboardPage from "@/pages/dashboard";
import AssetsPage from "@/pages/assets/index";
import StakeholdersPage from "@/pages/stakeholders/index";
import ApprovalWorkflowsPage from "@/pages/approval-workflows/index";
import SettingsPage from "@/pages/settings";

// Define our routes using the existing comprehensive pages
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ospo-ui-theme">
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Switch>
              {/* Public routes */}
              <Route path="/" component={HomePage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/events" component={EventsPage} />
              <Route path="/events/:id" component={EventDetailsPage} />
              <Route path="/cfp-submissions" component={CfpSubmissionsPage} />
              <Route path="/attendees" component={AttendeesPage} />
              <Route path="/sponsorships" component={SponsorshipsPage} />
              <Route path="/assets" component={AssetsPage} />
              <Route path="/stakeholders" component={StakeholdersPage} />
              <Route path="/approval-workflows" component={ApprovalWorkflowsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/profile" component={ProfilePage} />
              
              {/* 404 page */}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
