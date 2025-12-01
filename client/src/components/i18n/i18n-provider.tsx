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

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";

type I18nProviderProps = {
  children: React.ReactNode;
};

type I18nProviderState = {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
};

const initialState: I18nProviderState = {
  language: "en",
  setLanguage: async () => {},
  isLoading: true,
};

const I18nProviderContext = createContext<I18nProviderState>(initialState);

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n: i18nInstance } = useTranslation();
  const { authenticated, user } = useAuth();
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem("ospo-ui-language") || "en";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference from database when authenticated
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!authenticated || !user?.id) {
        // Not authenticated, use localStorage or browser default
        const stored = localStorage.getItem("ospo-ui-language");
        const detectedLanguage =
          stored || navigator.language.split("-")[0] || "en";
        setLanguageState(detectedLanguage);
        await i18nInstance.changeLanguage(detectedLanguage);
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch language preference from database
        const response = await apiRequest(
          "GET",
          `/api/users/${user.id}/preferences/language`
        );
        if (response.ok) {
          const data = await response.json();
          const dbLanguage = data.language || "en";
          setLanguageState(dbLanguage);
          await i18nInstance.changeLanguage(dbLanguage);
          // Sync to localStorage
          localStorage.setItem("ospo-ui-language", dbLanguage);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem("ospo-ui-language");
          const fallbackLanguage =
            stored || navigator.language.split("-")[0] || "en";
          setLanguageState(fallbackLanguage);
          await i18nInstance.changeLanguage(fallbackLanguage);
        }
      } catch (error) {
        console.error("Failed to load language preference:", error);
        // Fallback to localStorage
        const stored = localStorage.getItem("ospo-ui-language");
        const fallbackLanguage =
          stored || navigator.language.split("-")[0] || "en";
        setLanguageState(fallbackLanguage);
        await i18nInstance.changeLanguage(fallbackLanguage);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, [authenticated, user?.id, i18nInstance]);

  // Handle language change
  const setLanguage = useCallback(
    async (newLanguage: string) => {
      setLanguageState(newLanguage);
      await i18nInstance.changeLanguage(newLanguage);
      localStorage.setItem("ospo-ui-language", newLanguage);

      // If authenticated, save to database
      if (authenticated && user?.id) {
        try {
          await apiRequest(
            "PUT",
            `/api/users/${user.id}/preferences/language`,
            {
              language: newLanguage,
            }
          );
        } catch (error) {
          console.error(
            "Failed to save language preference to database:",
            error
          );
          // Continue anyway - localStorage is already updated
        }
      }
    },
    [authenticated, user?.id, i18nInstance]
  );

  const value = {
    language,
    setLanguage,
    isLoading,
  };

  return (
    <I18nProviderContext.Provider value={value}>
      {children}
    </I18nProviderContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nProviderContext);

  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
};
