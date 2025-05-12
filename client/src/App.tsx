import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import EventsPage from "@/pages/events/index";
import EventDetailsPage from "@/pages/events/details";
import CfpSubmissionsPage from "@/pages/cfp-submissions/index";
import AttendeesPage from "@/pages/attendees/index";
import SponsorshipsPage from "@/pages/sponsorships/index";
import AssetsPage from "@/pages/assets/index";
import StakeholdersPage from "@/pages/stakeholders/index";
import ApprovalWorkflowsPage from "@/pages/approval-workflows/index";
import ApprovalWorkflowDetailPage from "@/pages/approval-workflows/[id]";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import UnauthorizedPage from "@/pages/unauthorized";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            {/* Public routes */}
            <Route path="/login" component={LoginPage} />
            <Route path="/unauthorized" component={UnauthorizedPage} />
            
            {/* Protected routes wrapped in MainLayout */}
            <Route path="/">
              <ProtectedRoute>
                <MainLayout>
                  <EventsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/events">
              <ProtectedRoute>
                <MainLayout>
                  <EventsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/events/:id">
              {() => (
                <ProtectedRoute>
                  <MainLayout>
                    <EventDetailsPage />
                  </MainLayout>
                </ProtectedRoute>
              )}
            </Route>
            
            <Route path="/cfp-submissions">
              <ProtectedRoute>
                <MainLayout>
                  <CfpSubmissionsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/attendees">
              <ProtectedRoute>
                <MainLayout>
                  <AttendeesPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/sponsorships">
              <ProtectedRoute>
                <MainLayout>
                  <SponsorshipsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/assets">
              <ProtectedRoute>
                <MainLayout>
                  <AssetsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/stakeholders">
              <ProtectedRoute>
                <MainLayout>
                  <StakeholdersPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/approval-workflows">
              <ProtectedRoute>
                <MainLayout>
                  <ApprovalWorkflowsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/approval-workflows/:id">
              {() => (
                <ProtectedRoute>
                  <MainLayout>
                    <ApprovalWorkflowDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              )}
            </Route>
            
            <Route path="/settings">
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            {/* 404 page */}
            <Route>
              <MainLayout>
                <NotFound />
              </MainLayout>
            </Route>
          </Switch>
          
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
