import { Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { withAuthProtection } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CallbackPage from "@/pages/callback-page";

// Define our simplified routes for testing authentication
function App() {
  return (
    <TooltipProvider>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/callback" component={CallbackPage} />
        
        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
