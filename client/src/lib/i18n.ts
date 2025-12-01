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

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import commonEn from "@/locales/en/common.json";
import navigationEn from "@/locales/en/navigation.json";
import formsEn from "@/locales/en/forms.json";
import pagesEn from "@/locales/en/pages.json";
import eventsEn from "@/locales/en/events.json";
import assetsEn from "@/locales/en/assets.json";
import cfpEn from "@/locales/en/cfp.json";
import attendeesEn from "@/locales/en/attendees.json";
import modalsEn from "@/locales/en/modals.json";

const resources = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    forms: formsEn,
    pages: pagesEn,
    events: eventsEn,
    assets: assetsEn,
    cfp: cfpEn,
    attendees: attendeesEn,
    modals: modalsEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "navigation", "forms", "pages", "events", "assets", "cfp", "attendees", "modals"],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "ospo-ui-language",
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;

