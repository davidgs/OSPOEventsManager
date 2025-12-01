/* The MIT License (MIT)
 *
 * Copyright (c) 2025-present David G. Simmons
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

import { useTranslation } from "react-i18next";
import { format, formatDistance, formatRelative } from "date-fns";
import { enUS } from "date-fns/locale";

// Map i18n language codes to date-fns locales
const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  // Future locales can be added here:
  // es: es,
  // fr: frFR,
};

/**
 * Get date-fns locale from i18n language code
 */
function getDateFnsLocale(language: string): Locale {
  return dateFnsLocales[language] || enUS;
}

/**
 * Format a date using the current locale
 */
export function useFormattedDate() {
  const { i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  return {
    formatDate: (date: Date | string | number, formatStr: string = "PP") => {
      const dateObj = typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
      return format(dateObj, formatStr, { locale });
    },
    formatDistance: (date: Date | string | number, baseDate: Date = new Date()) => {
      const dateObj = typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
      return formatDistance(dateObj, baseDate, { locale, addSuffix: true });
    },
    formatRelative: (date: Date | string | number, baseDate: Date = new Date()) => {
      const dateObj = typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
      return formatRelative(dateObj, baseDate, { locale });
    },
    locale,
  };
}

/**
 * Format a number using the current locale
 */
export function useFormattedNumber() {
  const { i18n } = useTranslation();

  return {
    formatNumber: (
      value: number,
      options?: Intl.NumberFormatOptions
    ): string => {
      return new Intl.NumberFormat(i18n.language, options).format(value);
    },
    formatInteger: (value: number): string => {
      return new Intl.NumberFormat(i18n.language, {
        maximumFractionDigits: 0,
      }).format(value);
    },
    formatDecimal: (
      value: number,
      minimumFractionDigits: number = 2,
      maximumFractionDigits: number = 2
    ): string => {
      return new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    },
    formatPercent: (value: number, decimals: number = 0): string => {
      return new Intl.NumberFormat(i18n.language, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);
    },
  };
}

/**
 * Format currency using the current locale
 */
export function useFormattedCurrency() {
  const { i18n } = useTranslation();

  return {
    formatCurrency: (
      value: number,
      currency: string = "USD",
      options?: Intl.NumberFormatOptions
    ): string => {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency,
        ...options,
      }).format(value);
    },
    formatUSD: (value: number): string => {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: "USD",
      }).format(value);
    },
    formatEUR: (value: number): string => {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: "EUR",
      }).format(value);
    },
  };
}

// Type import for Locale
import type { Locale } from "date-fns";

