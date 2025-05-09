import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { assetTypes } from "@shared/schema";
import { formatBytes, formatDate } from "@/lib/utils";

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
  PresentationIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AssetUploadForm } from "@/components/forms/asset-upload-form";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Asset type definition
export type Asset = {
  id: number;
  name: string;
  type: "abstract" | "bio" | "headshot" | "trip_report" | "presentation" | "other";
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: number;
  uploadedAt: string;
  eventId: number | null;
  cfpSubmissionId: number | null;
  description: string | null;
};

export default function AssetsPage() {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch all assets
  const { data: assets, isLoading, isError } = useQuery({
    queryKey: ["/api/assets"]
  });
  
  // Fetch users to display asset owner names
  const { data: users } = useQuery({
    queryKey: ["/api/users/2"] // For now, we only have one user
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/assets/${id}`, {
        method: "DELETE"
      });
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
      filtered = filtered.filter(asset => asset.type === selectedTab);
    }
    
    // Then filter by type if a type is selected
    if (selectedType) {
      filtered = filtered.filter(asset => asset.type === selectedType);
    }
    
    return filtered;
  };

  // Helper function to download an asset
  const downloadAsset = (asset: Asset) => {
    window.open(asset.filePath, '_blank');
  };
  
  // Helper function to get the appropriate icon for a file based on mime type
  const getFileIcon = (mimeType: string) => {
    const type = mimeType.split('/')[0];
    const subType = mimeType.split('/')[1];
    
    if (type === 'image') {
      return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
    } else if (type === 'application') {
      if (subType.includes('pdf')) {
        return <FileText className="h-8 w-8 text-muted-foreground" />;
      } else if (subType.includes('powerpoint') || subType.includes('presentation')) {
        return <PresentationIcon className="h-8 w-8 text-muted-foreground" />;
      } else if (subType.includes('excel') || subType.includes('spreadsheet')) {
        return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />;
      } else if (subType.includes('zip') || subType.includes('archive') || subType.includes('compressed')) {
        return <FileArchive className="h-8 w-8 text-muted-foreground" />;
      } else if (subType.includes('word') || subType.includes('document')) {
        return <FileText className="h-8 w-8 text-muted-foreground" />;
      }
    } else if (type === 'text') {
      return <FileText className="h-8 w-8 text-muted-foreground" />;
    } else if (type === 'audio') {
      return <FileAudio className="h-8 w-8 text-muted-foreground" />;
    } else if (type === 'video') {
      return <FileVideo className="h-8 w-8 text-muted-foreground" />;
    }
    
    return <File className="h-8 w-8 text-muted-foreground" />;
  };
  
  // Helper function to get the asset owner's name
  const getAssetOwnerName = (userId: number) => {
    if (users && users.id === userId) {
      return users.name;
    }
    return "Unknown User";
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden max-w-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex justify-between items-start">
                <div className="w-[85%]">
                  <CardTitle className="text-xs font-medium truncate">{asset.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {formatBytes(asset.fileSize)} • {asset.mimeType.split('/')[1].toUpperCase()}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => downloadAsset(asset)} className="text-xs">
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
                          deleteAsset.mutate(asset.id);
                        }
                      }}
                      className="text-destructive text-xs"
                    >
                      <Trash className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            {/* Thumbnail preview area */}
            <div className="px-3 mb-1">
              {asset.mimeType.startsWith('image/') ? (
                <AspectRatio ratio={4/3} className="bg-muted rounded-md overflow-hidden">
                  <img 
                    src={asset.filePath} 
                    alt={asset.name}
                    className="object-contain w-full h-full"
                  />
                </AspectRatio>
              ) : (
                <AspectRatio ratio={4/3} className="bg-muted/40 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    {getFileIcon(asset.mimeType)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {asset.mimeType.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </AspectRatio>
              )}
            </div>
            
            <CardContent className="py-1 px-3">
              {asset.description && <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>}
              
              {/* Asset owner info */}
              <div className="flex items-center mt-2 text-xs">
                <User className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Owner: {getAssetOwnerName(asset.uploadedBy)}</span>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between pt-1 pb-2 px-3 text-xs text-muted-foreground">
              <div>
                <span className="capitalize">{asset.type.replace('_', ' ')}</span>
              </div>
              <div>Uploaded {formatDate(asset.uploadedAt)}</div>
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
            Manage your abstracts, bios, headshots, and other event-related assets
          </p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setIsUploadDialogOpen(true)}>
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
          <Select onValueChange={(value) => setSelectedType(value === "all" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
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
          <AssetUploadForm onComplete={() => setIsUploadDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}