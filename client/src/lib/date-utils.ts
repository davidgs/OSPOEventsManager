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

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

// Map i18n language codes to date-fns locales
const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  // Future locales can be added here:
  // es: es,
  // fr: frFR,
};

/**
 * Get date-fns locale from i18n language code
 * Defaults to English if language not found
 */
function getDateFnsLocale(language?: string): Locale {
  if (!language) {
    // Try to get from localStorage or browser
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("ospo-ui-language")
      : null;
    language = stored || (typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en");
  }
  return dateFnsLocales[language] || enUS;
}

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

/**
 * Format a date using locale-aware formatting
 * @param dateString - Date string, Date object, or null/undefined
 * @param formatStr - Format string (default: "MMM d, yyyy")
 * @param language - Optional language code (defaults to current i18n language)
 */
export const safeFormatDate = (
  dateString: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy",
  language?: string
): string => {
  const date = safeParseDate(dateString);
  if (!date) return "Invalid Date";

  try {
    const locale = getDateFnsLocale(language);
    return format(date, formatStr, { locale });
  } catch (error) {
    console.warn(`Error formatting date: ${dateString}`, error);
    return "Invalid Date";
  }
};

/**
 * Format a date range using locale-aware formatting
 * @param startDate - Start date string, Date object, or null/undefined
 * @param endDate - End date string, Date object, or null/undefined
 * @param language - Optional language code (defaults to current i18n language)
 */
export const safeFormatDateRange = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  language?: string
): string => {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);

  if (!start || !end) return "Invalid Date Range";

  try {
    const locale = getDateFnsLocale(language);
    return `${format(start, "MMM d, yyyy", { locale })} - ${format(end, "MMM d, yyyy", { locale })}`;
  } catch (error) {
    console.warn(`Error formatting date range: ${startDate} - ${endDate}`, error);
    return "Invalid Date Range";
  }
};




