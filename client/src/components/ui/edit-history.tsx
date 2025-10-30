import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Clock, User } from "lucide-react";

interface EditHistoryEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  edited_by_id: number;
  edited_at: string;
  change_description: string | null;
  editedByName: string;
  editedByAvatar: string | null;
}

interface EditHistoryProps {
  entityType: string;
  entityId: number;
  className?: string;
}

export const EditHistory: FC<EditHistoryProps> = ({
  entityType,
  entityId,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: historyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/edit-history/${entityType}/${entityId}`],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/edit-history/${entityType}/${entityId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch edit history: ${response.status}`);
      }
      const data = await response.json();
      console.log("Edit history API response:", data);
      return data;
    },
    enabled: isOpen, // Only fetch when expanded
  }) as { data: any; isLoading: boolean; error: any };

  // Ensure history is always an array
  const history = Array.isArray(historyData) ? historyData : [];

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Unable to load edit history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Clock className="h-4 w-4" />
              Edit History
              {history.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({history.length} {history.length === 1 ? "entry" : "entries"}
                  )
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading edit history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No edit history available
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={entry.editedByAvatar || undefined}
                        alt={entry.editedByName}
                      />
                      <AvatarFallback className="text-xs">
                        {entry.editedByAvatar ? (
                          getInitials(entry.editedByName)
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {entry.editedByName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.edited_at)}
                        </span>
                      </div>
                      {entry.change_description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {entry.change_description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default EditHistory;
