import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { User, Edit } from "lucide-react";

interface CreatorInfoProps {
  userId?: number;
  userName?: string;
  userAvatar?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  hasBeenEdited?: boolean;
  className?: string;
}

export const CreatorInfo: FC<CreatorInfoProps> = ({
  userId,
  userName = "Unknown User",
  userAvatar,
  createdAt,
  updatedAt,
  hasBeenEdited = false,
  className = "",
}) => {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return null;
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

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{userName}</div>
      {createdAt && (
        <div className="text-sm text-muted-foreground">
          Created: {formatDate(createdAt)}
        </div>
      )}
      {hasBeenEdited && updatedAt && (
        <div className="text-sm text-muted-foreground">
          Last edited: {formatDate(updatedAt)}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              {hasBeenEdited && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <Edit className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {userName}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreatorInfo;
