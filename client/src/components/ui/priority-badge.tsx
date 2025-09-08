import React from "react";
import { Badge } from "./badge";
import { safeToLowerCase } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const getPriorityColors = (priority: string): string => {
  const normalizedPriority = safeToLowerCase(priority);

  switch (normalizedPriority) {
    case "essential":
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
    case "high":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    case "important":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    case "medium":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "low":
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
    case "nice to have":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    default:
      return "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = "",
}) => {
  const priorityColors = getPriorityColors(priority);

  return (
    <Badge variant="outline" className={`${priorityColors} ${className}`}>
      {priority}
    </Badge>
  );
};

export default PriorityBadge;
