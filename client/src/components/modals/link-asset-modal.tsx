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

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { safeToLowerCase } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  File,
  FileText as FileTextIcon,
  PresentationIcon,
  Upload,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Asset } from "@shared/schema";

interface LinkAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

export function LinkAssetModal({
  isOpen,
  onClose,
  eventId,
}: LinkAssetModalProps) {
  const { t } = useTranslation(["modals", "assets", "common", "forms"]);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  // Fetch all unlinked assets (assets that aren't already linked to this event)
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: [`/api/assets?unlinked=${eventId}`],
    enabled: isOpen,
  });

  // Link assets to event mutation
  const { mutate: linkAssets, isPending: isLinking } = useMutation({
    mutationFn: async (assetIds: number[]) => {
      const promises = assetIds.map((assetId) =>
        apiRequest("PUT", `/api/assets/${assetId}`, { eventId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assets`] });
      queryClient.invalidateQueries({
        queryKey: ["/api/assets", "event", eventId],
      });
      toast({
        title: t("modals.linkAsset.linked"),
        description: t("modals.linkAsset.linkedDescription", { count: selectedAssets.length }),
      });
      onClose();
      setSelectedAssets([]);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("modals.linkAsset.linkFailed"),
        variant: "destructive",
      });
    },
  });

  // Filter assets based on search query
  const filteredAssets = assets.filter(
    (asset) =>
      safeToLowerCase(asset.name).includes(safeToLowerCase(searchQuery)) ||
      safeToLowerCase(asset.type).includes(safeToLowerCase(searchQuery))
      // Description field removed - not in asset schema
  );

  const handleToggleAsset = (assetId: number) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  const handleLinkAssets = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: t("modals.linkAsset.noAssetsSelected"),
        description: t("modals.linkAsset.noAssetsSelectedDescription"),
        variant: "destructive",
      });
      return;
    }
    linkAssets(selectedAssets);
  };

  // Clear selected assets when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedAssets([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  const getAssetIcon = (asset: any) => {
    if (asset.mimeType.startsWith("image/")) {
      return (
        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
          <img
            src={
              asset.file_path.startsWith("/")
                ? asset.file_path
                : `/${asset.file_path}`
            }
            alt={asset.name}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else {
      return asset.type === "abstract" ? (
        <FileTextIcon className="h-12 w-12 text-blue-500" />
      ) : asset.type === "presentation" ? (
        <PresentationIcon className="h-12 w-12 text-purple-500" />
      ) : asset.type === "trip_report" ? (
        <FileTextIcon className="h-12 w-12 text-green-500" />
      ) : (
        <File className="h-12 w-12 text-gray-500" />
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("modals.linkAsset.title")}</DialogTitle>
          <DialogDescription>
            {t("modals.linkAsset.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("modals.linkAsset.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              aria-label={t("common.clearSearch", "Clear search")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingAssets ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t("modals.linkAsset.noAssetsFound")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? t("modals.linkAsset.noMatch")
                  : t("modals.linkAsset.noUnlinkedAssets")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAssets.map((asset: any) => (
                <div
                  key={asset.id}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    selectedAssets.includes(asset.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="mr-3">
                    <Checkbox
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => handleToggleAsset(asset.id)}
                      id={`asset-${asset.id}`}
                    />
                  </div>
                  <div className="mr-4">{getAssetIcon(asset)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {asset.name}
                      </h4>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800 capitalize">
                        {asset.type.replace("_", " ")}
                      </span>
                    </div>
                    {asset.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {asset.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {t("modals.linkAsset.uploadedBy", { name: asset.uploadedByName || t("common.unknown") })} •{" "}
                      {(asset.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  {selectedAssets.includes(asset.id) && (
                    <CheckCircle2 className="h-5 w-5 text-primary ml-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center mr-auto">
            <span className="text-sm text-gray-500">
              {t("modals.linkAsset.selectedCount", { count: selectedAssets.length })}
            </span>
          </div>
          <Button variant="outline" onClick={onClose} disabled={isLinking}>
            {t("forms.buttons.cancel")}
          </Button>
          <Button
            onClick={handleLinkAssets}
            disabled={selectedAssets.length === 0 || isLinking}
          >
            {isLinking ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                {t("modals.linkAsset.linking")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("modals.linkAsset.linkButton")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
