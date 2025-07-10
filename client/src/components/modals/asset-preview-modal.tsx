import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Asset } from "@shared/schema";
import { formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PRFViewer } from "@/components/ui/prf-viewer";
import { PDFViewer } from "@/components/ui/pdf-viewer";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Plus,
  File,
  FileText,
  Save,
  Trash,
  PresentationIcon,
  FileSpreadsheet,
  BookOpen,
  User,
  FileIcon,
  Maximize,
} from "lucide-react";

// Define types for annotations
export type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: Date;
  createdBy?: string;
};

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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ x: 0, y: 0, text: "" });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens with a new asset
  useEffect(() => {
    if (isOpen && asset) {
      setScale(1);
      setRotation(0);
      setAnnotations([]);
      setIsAddingAnnotation(false);
      setSelectedAnnotation(null);

      // Load annotations from localStorage if available
      const savedAnnotations = localStorage.getItem(
        `asset-annotations-${asset.id}`
      );
      if (savedAnnotations) {
        try {
          setAnnotations(JSON.parse(savedAnnotations));
        } catch (e) {
          console.error("Failed to parse saved annotations", e);
        }
      }
    }
  }, [isOpen, asset]);

  // Save annotations to localStorage when they change
  useEffect(() => {
    if (asset && annotations.length > 0) {
      localStorage.setItem(
        `asset-annotations-${asset.id}`,
        JSON.stringify(annotations)
      );
    }
  }, [annotations, asset]);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewAnnotation({ ...newAnnotation, x, y });
    setIsAddingAnnotation(false);

    // Create a new annotation
    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      x,
      y,
      text: newAnnotation.text || "New annotation",
      createdAt: new Date(),
      createdBy: userName,
    };

    setAnnotations([...annotations, annotation]);
    setSelectedAnnotation(annotation.id);
    setNewAnnotation({ x: 0, y: 0, text: "" });
  };

  const handleAnnotationClick = (id: string) => {
    setSelectedAnnotation(id === selectedAnnotation ? null : id);
  };

  const handleAnnotationChange = (id: string, text: string) => {
    setAnnotations(
      annotations.map((ann) => (ann.id === id ? { ...ann, text } : ann))
    );
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((ann) => ann.id !== id));
    setSelectedAnnotation(null);
  };

  const handleDownload = () => {
    if (asset) {
      window.open(asset.file_path, "_blank");
    }
  };

  // Helper function to get appropriate file icon
  const getFileIcon = (mimeType: string) => {
    const type = mimeType.split("/")[0];
    const subType = mimeType.split("/")[1];

    if (type === "application") {
      if (subType.includes("pdf")) {
        return <FileText className="h-12 w-12 text-muted-foreground" />;
      } else if (
        subType.includes("powerpoint") ||
        subType.includes("presentation")
      ) {
        return <PresentationIcon className="h-12 w-12 text-muted-foreground" />;
      } else if (subType.includes("excel") || subType.includes("spreadsheet")) {
        return <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />;
      } else if (subType.includes("word") || subType.includes("document")) {
        return <BookOpen className="h-12 w-12 text-muted-foreground" />;
      } else if (subType.includes("prf")) {
        return <FileIcon className="h-12 w-12 text-muted-foreground" />;
      }
    }

    return <File className="h-12 w-12 text-muted-foreground" />;
  };

  // Helper function to check if the file is a PRF
  const isPrfFile = (mimeType: string, filename: string): boolean => {
    if (mimeType === "application/prf" || mimeType === "application/x-prf") {
      return true;
    }

    // Also check file extension
    if (filename.toLowerCase().endsWith(".prf")) {
      return true;
    }

    return false;
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <DialogTitle className="mr-4 text-lg break-words">
              {asset.name}
            </DialogTitle>
            <div className="flex flex-wrap gap-2">
              {/* Mobile-optimized controls with icons only on small screens */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
              >
                <ZoomOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Zoom Out</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
              >
                <ZoomIn className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Zoom In</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRotate}
                className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
              >
                <RotateCw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Rotate</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
              >
                <Download className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                className={`h-8 w-8 sm:h-auto sm:w-auto sm:px-3 ${
                  isAddingAnnotation ? "bg-primary/20" : ""
                }`}
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Add Note</span>
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            {formatBytes(asset.file_size)} •{" "}
            {asset.mime_type.split("/")[1].toUpperCase()} • Uploaded{" "}
            {formatDate(asset.uploaded_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 mt-4 flex-1 min-h-0">
          <div
            className="order-2 md:order-1 md:col-span-2 bg-muted/30 rounded-md flex items-center justify-center border border-border min-h-[300px] relative overflow-hidden"
            ref={previewRef}
            onClick={handleImageClick}
            style={{
              cursor: isAddingAnnotation ? "crosshair" : "default",
            }}
          >
            {asset.mime_type.startsWith("image/") ? (
              <div
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              >
                <img
                  src={asset.file_path}
                  alt={asset.name}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            ) : isPrfFile(asset.mime_type, asset.name) ? (
              <div className="w-full h-full min-h-[400px]">
                <PRFViewer
                  filePath={asset.file_path}
                  scale={scale}
                  rotation={rotation}
                />
              </div>
            ) : asset.mime_type === "application/pdf" ||
              asset.name.toLowerCase().endsWith(".pdf") ? (
              <div className="w-full h-full min-h-[400px]">
                <PDFViewer
                  filePath={asset.file_path}
                  scale={scale}
                  rotation={rotation}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                {getFileIcon(asset.mime_type)}
                <div className="text-center mt-4">
                  <p className="text-sm font-medium mb-2">
                    {asset.mime_type.split("/")[1].toUpperCase()} file preview
                    not available
                  </p>
                  <Button size="sm" onClick={handleDownload}>
                    Download to view
                  </Button>
                </div>
              </div>
            )}

            {/* Annotations */}
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`absolute w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  selectedAnnotation === annotation.id
                    ? "ring-2 ring-offset-2 ring-primary"
                    : ""
                }`}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  zIndex: selectedAnnotation === annotation.id ? 20 : 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnnotationClick(annotation.id);
                }}
              >
                <span className="text-xs font-bold">
                  {annotations.indexOf(annotation) + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="order-1 md:order-2 bg-muted/10 rounded-md p-4 border border-border min-h-[200px] md:min-h-[300px] flex flex-col">
            <h3 className="text-sm font-semibold mb-2">Asset Information</h3>
            <div className="text-xs mb-4">
              <p className="mb-1">
                <span className="font-semibold">Type:</span>{" "}
                {asset.type.replace("_", " ")}
              </p>
              <p className="mb-1">
                <span className="font-semibold">Size:</span>{" "}
                {formatBytes(asset.file_size)}
              </p>
              {asset.description && (
                <p className="mb-1">
                  <span className="font-semibold">Description:</span>{" "}
                  {asset.description}
                </p>
              )}
              <div className="flex items-center mt-2">
                <User className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Owner: {userName}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold mb-2 mt-4">Annotations</h3>
            {annotations.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                {isAddingAnnotation
                  ? "Click on the image to place an annotation..."
                  : "No annotations yet. Click 'Add Note' to create one."}
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {annotations.map((annotation, index) => (
                    <div
                      key={annotation.id}
                      className={`p-2 rounded-md text-xs transition-colors ${
                        selectedAnnotation === annotation.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/20"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="font-semibold mr-1">
                            Note {index + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(annotation.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                        >
                          <Trash className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {selectedAnnotation === annotation.id ? (
                        <Textarea
                          value={annotation.text}
                          onChange={(e) =>
                            handleAnnotationChange(
                              annotation.id,
                              e.target.value
                            )
                          }
                          className="min-h-[80px] text-xs"
                          placeholder="Enter annotation text..."
                        />
                      ) : (
                        <p
                          className="whitespace-pre-wrap"
                          onClick={() => handleAnnotationClick(annotation.id)}
                        >
                          {annotation.text}
                        </p>
                      )}
                      {annotation.createdBy && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Added by: {annotation.createdBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {isAddingAnnotation && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="annotation-text" className="text-xs">
                  New annotation text:
                </Label>
                <Textarea
                  id="annotation-text"
                  value={newAnnotation.text}
                  onChange={(e) =>
                    setNewAnnotation({ ...newAnnotation, text: e.target.value })
                  }
                  placeholder="Enter text for the new annotation..."
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Click on the image to place this annotation
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex space-x-2 justify-end w-full">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
