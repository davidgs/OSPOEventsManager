import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { assetTypes } from "@shared/schema";
import { formatBytes, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MoreVertical,
  File,
  Download,
  Trash,
  Image as ImageIcon,
  FileText,
  BookOpen,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  User,
  FileBarChart,
  PresentationIcon,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimpleFileUploader } from "@/components/forms/simple-file-uploader";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AssetPreviewModal } from "@/components/modals/asset-preview-modal";
import { type Asset } from "@shared/schema";

export default function AssetsPage() {
  const { toast } = useToast();
  const { user, initialized, authenticated } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Fetch all assets
  const {
    data: assets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/assets"],
  }) as { data: any[] | undefined; isLoading: boolean; isError: boolean };

  // Note: We don't need to fetch users separately because the backend
  // already provides uploadedByName in the assets response

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Asset deleted",
        description: "The asset has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete asset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper function to filter assets by tab and type
  const getFilteredAssets = () => {
    if (!assets) return [];

    let filtered = [...assets];

    // First filter by tab
    if (selectedTab !== "all") {
      filtered = filtered.filter((asset) => asset.type === selectedTab);
    }

    // Then filter by type if a type is selected
    if (selectedType) {
      filtered = filtered.filter((asset) => asset.type === selectedType);
    }

    return filtered;
  };

  // Helper function to download an asset
  const downloadAsset = (asset: Asset) => {
    window.open(asset.file_path, "_blank");
  };

  // Open asset preview modal
  const openAssetPreview = (asset: Asset) => {
    setPreviewAsset(asset);
    setIsPreviewModalOpen(true);
  };

  // Close asset preview modal
  const closeAssetPreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewAsset(null);
  };

  // Helper function to get the appropriate icon for a file based on mime type
  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />;

    const type = mimeType.split("/")[0];
    const subType = mimeType.split("/")[1];

    if (type === "image") {
      return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    } else if (type === "application") {
      if (subType?.includes("pdf")) {
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      } else if (
        subType?.includes("powerpoint") ||
        subType?.includes("presentation")
      ) {
        return <PresentationIcon className="h-4 w-4 text-muted-foreground" />;
      } else if (
        subType?.includes("excel") ||
        subType?.includes("spreadsheet")
      ) {
        return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />;
      } else if (
        subType?.includes("zip") ||
        subType?.includes("archive") ||
        subType?.includes("compressed")
      ) {
        return <FileArchive className="h-4 w-4 text-muted-foreground" />;
      } else if (subType?.includes("word") || subType?.includes("document")) {
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      }
    } else if (type === "text") {
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    } else if (type === "audio") {
      return <FileAudio className="h-4 w-4 text-muted-foreground" />;
    } else if (type === "video") {
      return <FileVideo className="h-4 w-4 text-muted-foreground" />;
    }

    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  // Helper function to get asset owner name
  const getAssetOwnerName = (asset: any) => {
    // The backend already provides uploadedByName in the asset data
    return asset.uploadedByName || "Unknown User";
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="container py-6">
        <div className="bg-destructive/10 p-4 rounded-lg text-destructive">
          <p>Failed to load assets. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Render asset cards
  const renderAssetCards = () => {
    const filteredAssets = getFilteredAssets();

    if (filteredAssets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <File className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No assets found. Upload some assets to get started.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredAssets.map((asset) => (
          <Card
            key={asset.id}
            className="overflow-hidden w-full h-full hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openAssetPreview(asset)}
          >
            <CardHeader className="pb-0 pt-2 px-4">
              <div className="flex justify-between items-start">
                <div className="w-[80%]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Title:</span>
                    <CardTitle className="text-sm font-medium truncate">
                      {asset.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {formatBytes(asset.file_size)} •{" "}
                    {asset.mime_type
                      ? asset.mime_type.split("/")[1]?.toUpperCase() || "FILE"
                      : "FILE"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()} // Prevent parent Card onClick from triggering
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAsset(asset);
                      }}
                      className="text-xs"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this asset? This action cannot be undone."
                          )
                        ) {
                          deleteAsset.mutate(asset.id);
                        }
                      }}
                      className="text-destructive text-xs"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {/* Thumbnail preview area - SMALLER SIZE */}
            <div className="px-4 pb-2">
              <div className="bg-muted/20 border border-border rounded-md p-1">
                <div className="max-h-[75px] h-[75px]">
                  {asset.mime_type && asset.mime_type.startsWith("image/") ? (
                    <AspectRatio
                      ratio={4 / 3}
                      className="bg-muted rounded-md overflow-hidden h-[75px]"
                    >
                      <img
                        src={asset.file_path}
                        alt={asset.name}
                        className="object-contain w-full h-full"
                      />
                    </AspectRatio>
                  ) : (
                    <AspectRatio
                      ratio={4 / 3}
                      className="bg-muted/30 rounded-md flex items-center justify-center h-[75px]"
                    >
                      <div className="text-center">
                        {getFileIcon(asset.mime_type)}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {asset.mime_type
                            ? asset.mime_type.split("/")[1]?.toUpperCase() ||
                              "FILE"
                            : "FILE"}
                        </p>
                      </div>
                    </AspectRatio>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="py-2 px-4">
              {asset.description && (
                <div className="mb-2">
                  <span className="text-xs font-bold block mb-1">
                    Description:
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {asset.description}
                  </p>
                </div>
              )}

              {/* Asset owner info */}
              <div className="flex items-center mt-3 text-xs">
                <User className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Owner: {getAssetOwnerName(asset)}
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-2 pb-3 px-4 text-xs text-muted-foreground">
              <div>
                <span className="capitalize">
                  {asset.type.replace("_", " ")}
                </span>
              </div>
              <div>Uploaded {formatDate(asset.uploaded_at)}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage your abstracts, bios, headshots, and other event-related
            assets
          </p>
        </div>
        <Button
          className="mt-4 md:mt-0"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          Upload New Asset
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
        <Tabs
          defaultValue="all"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="abstract">Abstracts</TabsTrigger>
            <TabsTrigger value="bio">Bios</TabsTrigger>
            <TabsTrigger value="headshot">Headshots</TabsTrigger>
            <TabsTrigger value="trip_report">Trip Reports</TabsTrigger>
            <TabsTrigger value="presentation">Presentations</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-[200px]">
          <Select
            onValueChange={(value) =>
              setSelectedType(value === "all" ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() +
                    type.slice(1).replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderAssetCards()}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Asset</DialogTitle>
            <DialogDescription>
              Upload files related to events, presentations, and profiles.
            </DialogDescription>
          </DialogHeader>
          <SimpleFileUploader onComplete={() => setIsUploadDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Asset Preview Modal */}
      <AssetPreviewModal
        asset={previewAsset}
        isOpen={isPreviewModalOpen}
        onClose={closeAssetPreview}
        userName={user?.name || "User"}
      />
    </div>
  );
}
