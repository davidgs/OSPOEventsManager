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

import React from 'react';
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { t } = useTranslation(["common"]);
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      // Logout will redirect, so we don't need to handle success
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t("common.logoutFailed", "Logout Failed"),
        description: t("common.logoutFailedDescription", "There was a problem signing out. Please try again."),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2"
      size="sm"
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? t("common.signingOut", "Signing out...") : t("common.signOut", "Sign Out")}
    </Button>
  );
}