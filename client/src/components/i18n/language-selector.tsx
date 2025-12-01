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

import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "./i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Available languages (initially just English)
const languages = [
  { code: "en", name: "English", nativeName: "English" },
  // Future languages can be added here:
  // { code: "es", name: "Spanish", nativeName: "Español" },
  // { code: "fr", name: "French", nativeName: "Français" },
];

type LanguageSelectorProps = {
  variant?: "select" | "button";
  size?: "sm" | "lg" | "default";
  className?: string;
};

export function LanguageSelector({
  variant = "select",
  size = "sm",
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage, isLoading } = useI18n();

  const handleLanguageChange = async (newLanguage: string) => {
    await setLanguage(newLanguage);
  };

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size={size || "sm"}
        className={className}
        disabled={isLoading}
        title={`Current language: ${currentLanguage.nativeName}`}
      >
        <Languages className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
      </Button>
    );
  }

  return (
    <Select value={language} onValueChange={handleLanguageChange} disabled={isLoading}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue>
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
            <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs">({lang.name})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

