import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function Footer() {
  const { user } = useAuth();

  // Fetch version information
  const { data: versionInfo } = useQuery({
    queryKey: ["/api/version"],
    queryFn: async () => {
      const response = await fetch("/api/version");
      if (!response.ok) throw new Error("Failed to fetch version");
      return response.json();
    },
  });

  // Function to open feedback email
  const openFeedbackEmail = () => {
    const subject = encodeURIComponent("OSPO Events Manager Feedback");
    const body = encodeURIComponent(
      `Hi David,\n\nI have feedback about the OSPO Events Manager application:\n\n[Please share your feedback here]\n\n---\nVersion: ${
        versionInfo?.version || "Unknown"
      }\nEnvironment: ${versionInfo?.environment || "Unknown"}\nURL: ${
        window.location.href
      }\nUser: ${
        user?.email || "Anonymous"
      }\nTimestamp: ${new Date().toISOString()}`
    );
    const mailtoUrl = `mailto:davidgs@redhat.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, "_blank");
  };

  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Left side - Application info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">OSPO Events Manager</span>
              {versionInfo && (
                <span className="px-2 py-1 text-xs font-medium bg-muted rounded">
                  v{versionInfo.version}
                </span>
              )}
            </div>
            {versionInfo && (
              <div className="text-xs text-center sm:text-left">
                <span>Environment: {versionInfo.environment}</span>
                {versionInfo.buildDate && (
                  <span className="ml-2">
                    Built:{" "}
                    {new Date(versionInfo.buildDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={openFeedbackEmail}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Feedback
            </Button>

            <a
              href="https://github.com/davidgs/OSPOEventsManager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom row - Copyright */}
        <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Red Hat, Inc. Built with ❤️ for Open
            Source Program Office.
          </p>
        </div>
      </div>
    </footer>
  );
}
