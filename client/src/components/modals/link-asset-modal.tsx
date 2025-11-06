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
        title: "Assets Linked",
        description: `Successfully linked ${selectedAssets.length} asset(s) to the event.`,
      });
      onClose();
      setSelectedAssets([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link assets to event",
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
        title: "No Assets Selected",
        description: "Please select at least one asset to link to the event.",
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
          <DialogTitle>Link Existing Assets</DialogTitle>
          <DialogDescription>
            Select assets to link to this event. You can search by name, type,
            or description.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
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
                No Assets Found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? "No assets match your search criteria"
                  : "There are no unlinked assets available"}
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
                      Uploaded by {asset.uploadedByName || "Unknown"} •{" "}
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
              {selectedAssets.length} asset(s) selected
            </span>
          </div>
          <Button variant="outline" onClick={onClose} disabled={isLinking}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkAssets}
            disabled={selectedAssets.length === 0 || isLinking}
          >
            {isLinking ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Linking...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Link Assets
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
