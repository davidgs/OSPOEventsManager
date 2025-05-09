import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import EventsPage from "@/pages/events/index";
import EventDetailsPage from "@/pages/events/details";
import CfpSubmissionsPage from "@/pages/cfp-submissions/index";
import AttendeesPage from "@/pages/attendees/index";
import SponsorshipsPage from "@/pages/sponsorships/index";
import SettingsPage from "@/pages/settings";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainLayout>
          <Switch>
            <Route path="/" component={EventsPage} />
            <Route path="/events" component={EventsPage} />
            <Route path="/events/:id" component={EventDetailsPage} />
            <Route path="/cfp-submissions" component={CfpSubmissionsPage} />
            <Route path="/attendees" component={AttendeesPage} />
            <Route path="/sponsorships" component={SponsorshipsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
