import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { PlusIcon, FileIcon, DownloadIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AssetUploadForm } from "@/components/forms/asset-upload-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatBytes, formatDate } from "@/lib/utils";

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
  const [filter, setFilter] = useState<string>("");
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const { toast } = useToast();

  const { data: assets, isLoading } = useQuery({
    queryKey: ["/api/assets", filter],
    queryFn: async () => {
      const url = filter 
        ? `/api/assets?type=${filter}` 
        : "/api/assets";
      const response = await fetch(url);
      const data = await response.json();
      return data as Asset[];
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/assets/${id}`, {
        method: "DELETE",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the asset.",
        variant: "destructive",
      });
    }
  };

  const assetTypeLabels = {
    abstract: "Abstract",
    bio: "Biography",
    headshot: "Headshot",
    trip_report: "Trip Report",
    presentation: "Presentation",
    other: "Other",
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assets Library</h1>
          <p className="text-gray-500">Manage your event-related assets and files</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All assets</SelectItem>
              <SelectItem value="abstract">Abstracts</SelectItem>
              <SelectItem value="bio">Biographies</SelectItem>
              <SelectItem value="headshot">Headshots</SelectItem>
              <SelectItem value="trip_report">Trip Reports</SelectItem>
              <SelectItem value="presentation">Presentations</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" /> Upload Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload New Asset</DialogTitle>
              </DialogHeader>
              <AssetUploadForm onComplete={() => setOpenUploadDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets Library</CardTitle>
          <CardDescription>
            View, download, and manage your organization's assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">Loading assets...</div>
          ) : assets && assets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileIcon className="h-5 w-5 mr-2 text-gray-400" />
                        <span>{asset.name}</span>
                      </div>
                      {asset.description && (
                        <p className="text-xs text-gray-500 mt-1">{asset.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{assetTypeLabels[asset.type]}</TableCell>
                    <TableCell>{formatBytes(asset.fileSize)}</TableCell>
                    <TableCell>{formatDate(asset.uploadedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={asset.filePath}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </a>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete asset</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this asset? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(asset.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">No assets found</p>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" /> Upload your first asset
                </Button>
              </DialogTrigger>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}