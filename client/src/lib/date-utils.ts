// Date utility functions for safe date parsing
export const safeParseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString) return null;

  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }

  // Try to parse the date string
  const parsed = new Date(dateString);

  // Check if the parsed date is valid
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return null;
  }

  return parsed;
};

export const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string = "MMM d, yyyy"): string => {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Date";

  try {
    const { format } = require("date-fns");
    return format(date, formatStr);
  } catch (error) {
    console.warn(`Error formatting date: ${dateString}`, error);
    return "Invalid Date";
  }
};

export const safeFormatDateRange = (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): string => {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);

  if (!start || !end) return "Invalid Date Range";

  try {
    const { format } = require("date-fns");
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  } catch (error) {
    console.warn(`Error formatting date range: ${startDate} - ${endDate}`, error);
    return "Invalid Date Range";
  }
};

