import React from "react";
import { Badge } from "./badge";
import { safeToLowerCase, safeCapitalize } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  className?: string;
}

const getTypeColors = (type: string): string => {
  const normalizedType = safeToLowerCase(type);

  switch (normalizedType) {
    case "conference":
      return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    case "workshop":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    case "meetup":
      return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
    case "hackathon":
      return "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800";
    case "webinar":
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800";
    case "networking":
      return "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800";
    case "summit":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    default:
      return "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  className = "",
}) => {
  const typeColors = getTypeColors(type);
  const displayText = safeCapitalize(type);

  return (
    <Badge variant="outline" className={`${typeColors} ${className}`}>
      {displayText}
    </Badge>
  );
};

export default TypeBadge;
