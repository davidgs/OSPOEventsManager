import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { assetTypes } from "@shared/schema";
import { formatBytes } from "@/lib/utils";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

// Max file size is 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/gif", 
  "application/pdf", 
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "application/zip"
];

type AssetUploadFormProps = {
  onComplete: () => void;
};

const assetUploadSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  type: z.enum(assetTypes as [string, ...string[]]),
  description: z.string().optional(),
  eventId: z.string().optional(),
  cfpSubmissionId: z.string().optional(),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "File is required")
    .refine(
      (files) => files[0].size <= MAX_FILE_SIZE,
      `File size must be less than ${formatBytes(MAX_FILE_SIZE)}`
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files[0].type),
      "File type not supported"
    ),
});

type AssetUploadFormValues = z.infer<typeof assetUploadSchema>;

export function AssetUploadForm({ onComplete }: AssetUploadFormProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<AssetUploadFormValues>({
    resolver: zodResolver(assetUploadSchema),
    defaultValues: {
      name: "",
      type: "other",
      description: "",
      eventId: "",
      cfpSubmissionId: "",
    },
  });

  const upload = useMutation({
    mutationFn: async (values: AssetUploadFormValues) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      
      if (values.description) {
        formData.append("description", values.description);
      }
      
      if (values.eventId) {
        formData.append("eventId", values.eventId);
      }
      
      if (values.cfpSubmissionId) {
        formData.append("cfpSubmissionId", values.cfpSubmissionId);
      }
      
      // Add the file
      formData.append("file", values.file[0]);
      
      return apiRequest("/api/assets", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Asset uploaded successfully",
        description: "Your file has been uploaded and is now available in the assets library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: `There was an error uploading your file: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AssetUploadFormValues) => {
    upload.mutate(values);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Triggers when file is dropped
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      form.setValue("file", e.dataTransfer.files);
      form.trigger("file");
    }
  };

  // Triggers when file is selected with click
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("file", e.target.files);
      form.trigger("file");
    }
  };

  // Triggers the input when the button is clicked
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter a name for this asset" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add details about this asset" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <div
                  className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer ${
                    dragActive ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={onButtonClick}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={inputRef}
                    onChange={handleChange}
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    {...rest}
                  />
                  
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    
                    <div className="text-sm">
                      <p className="font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-muted-foreground">
                        Files up to {formatBytes(MAX_FILE_SIZE)}
                      </p>
                    </div>
                    
                    {form.getValues("file") && (
                      <div className="mt-4 p-2 bg-secondary rounded flex items-center justify-center text-sm">
                        <span className="truncate max-w-xs">
                          {form.getValues("file")[0]?.name} ({formatBytes(form.getValues("file")[0]?.size)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-2"
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Asset"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}