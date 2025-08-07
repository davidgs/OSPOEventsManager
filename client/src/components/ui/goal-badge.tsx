import React from "react";
import { Badge } from "./badge";

interface GoalBadgeProps {
  goal: string;
  className?: string;
}

const getGoalColors = (goal: string): string => {
  const normalizedGoal = goal?.toLowerCase() || "";

  switch (normalizedGoal) {
    case "speaking":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "sponsoring":
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
    case "attending":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "exhibiting":
      return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    case "networking":
      return "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800";
    case "learning":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "recruiting":
      return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    default:
      return "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
};

export const GoalBadge: React.FC<GoalBadgeProps> = ({
  goal,
  className = "",
}) => {
  const goalColors = getGoalColors(goal);
  const displayText = goal.charAt(0).toUpperCase() + goal.slice(1);

  return (
    <Badge variant="outline" className={`${goalColors} ${className}`}>
      {displayText}
    </Badge>
  );
};

export default GoalBadge;
