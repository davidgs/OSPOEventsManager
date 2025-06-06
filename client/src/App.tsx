import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { withAuthProtection } from "@/contexts/auth-context";
import { Header } from "@/components/layout/Header";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import EventsPage from "@/pages/events";
import EventDetailsPage from "@/pages/event-details";

// Define our simplified routes for testing authentication
function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Switch>
            {/* Public routes */}
            <Route path="/" component={HomePage} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/events" component={EventsPage} />
            <Route path="/events/:id" component={EventDetailsPage} />
            
            {/* 404 page */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
