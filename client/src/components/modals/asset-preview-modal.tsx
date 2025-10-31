import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Asset } from "@shared/schema";
import { formatBytes, formatDate, safeToLowerCase } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PRFViewer } from "@/components/ui/prf-viewer";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Edit,
  Save,
  X,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  File,
} from "lucide-react";

interface AssetPreviewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function AssetPreviewModal({
  asset,
  isOpen,
  onClose,
  userName,
}: AssetPreviewModalProps) {
  const { toast } = useToast();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  // Description removed - not in asset schema
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (asset) {
      setEditedName(asset.name);
      setZoom(100);
      setRotation(0);
    }
  }, [asset]);

  const downloadAsset = () => {
    if (asset) {
      window.open(asset.file_path, "_blank");
    }
  };

  // Update asset mutation
  const updateAsset = useMutation({
    mutationFn: async (updatedAsset: Partial<Asset>) => {
      if (!asset) throw new Error("Asset is required");
      return apiRequest("PUT", `/api/assets/${asset.id}`, updatedAsset);
    },
    onSuccess: () => {
      toast({
        title: "Asset updated",
        description: "The asset has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update asset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!asset) return;

    updateAsset.mutate({
      name: editedName,
      // Description field removed - not in asset schema
    });
  };

  const handleCancel = () => {
    setEditedName(asset?.name || "");
    setIsEditing(false);
  };

  if (!asset) return null;

  const isPrfFile = (mimeType: string, fileName: string) => {
    return (
      mimeType === "application/octet-stream" &&
      safeToLowerCase(fileName).endsWith(".prf")
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <File className="h-6 w-6" />;

    const type = mimeType.split("/")[0];
    const subType = mimeType.split("/")[1];

    if (type === "image") {
      return <ImageIcon className="h-6 w-6" />;
    } else if (type === "application") {
      if (subType?.includes("pdf")) {
        return <FileText className="h-6 w-6" />;
      } else if (
        subType?.includes("powerpoint") ||
        subType?.includes("presentation")
      ) {
        return <FileText className="h-6 w-6" />;
      } else if (
        subType?.includes("excel") ||
        subType?.includes("spreadsheet")
      ) {
        return <FileSpreadsheet className="h-6 w-6" />;
      } else if (subType?.includes("zip") || subType?.includes("archive")) {
        return <FileArchive className="h-6 w-6" />;
      } else if (subType?.includes("word") || subType?.includes("document")) {
        return <FileText className="h-6 w-6" />;
      }
    } else if (type === "text") {
      return <FileText className="h-6 w-6" />;
    } else if (type === "audio") {
      return <FileAudio className="h-6 w-6" />;
    } else if (type === "video") {
      return <FileVideo className="h-6 w-6" />;
    }

    return <File className="h-6 w-6" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(asset.mime_type)}
              <div>
                <DialogTitle className="text-lg">{asset.name}</DialogTitle>
                <DialogDescription className="text-sm">
                  {formatBytes(asset.file_size)} •{" "}
                  {asset.mime_type.split("/")[1].toUpperCase()} • Uploaded{" "}
                  {formatDate(asset.uploaded_at)}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsset}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-auto space-y-4">
          {/* Asset Info Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset-name">Name</Label>
                {isEditing ? (
                  <Input
                    id="asset-name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{asset.name}</p>
                )}
              </div>
              <div>
                <Label>Type</Label>
                <Badge variant="secondary" className="mt-1">
                  {asset.type.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Description section removed - not in asset schema */}

            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateAsset.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateAsset.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              {asset.mime_type.startsWith("image/") && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{zoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((rotation + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-4">
                {asset.mime_type.startsWith("image/") ? (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      className="w-full h-auto max-h-[500px] object-contain"
                      style={{
                        transform: `scale(${
                          zoom / 100
                        }) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                      }}
                      src={asset.file_path}
                      alt={asset.name}
                    />
                  </div>
                ) : isPrfFile(asset.mime_type, asset.name) ? (
                  <PRFViewer
                    filePath={asset.file_path}
                    scale={zoom / 100}
                    rotation={rotation}
                  />
                ) : asset.mime_type === "application/pdf" ? (
                  <PDFViewer
                    filePath={asset.file_path}
                    scale={zoom / 100}
                    rotation={rotation}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    {getFileIcon(asset.mime_type)}
                    <p className="mt-4 text-sm text-muted-foreground">
                      Preview not available for this file type
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click download to view the file
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
