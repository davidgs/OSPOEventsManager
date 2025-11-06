/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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



