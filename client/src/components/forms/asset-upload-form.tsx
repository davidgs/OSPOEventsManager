import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  type: z.enum(["abstract", "bio", "headshot", "trip_report", "presentation", "other"], {
    required_error: "Please select an asset type.",
  }),
  description: z.string().optional(),
  eventId: z.string().optional(),
  cfpSubmissionId: z.string().optional(),
  file: z.instanceof(File, {
    message: "Please select a file to upload.",
  }),
});

type AssetUploadFormProps = {
  onComplete: () => void;
};

export function AssetUploadForm({ onComplete }: AssetUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: events } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      return response.json();
    },
  });

  const { data: cfpSubmissions } = useQuery({
    queryKey: ["/api/cfp-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/cfp-submissions");
      return response.json();
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/2"],
    queryFn: async () => {
      const response = await fetch("/api/users/2");
      return response.json();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: undefined,
      description: "",
      eventId: undefined,
      cfpSubmissionId: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", values.file);
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("uploadedBy", currentUser.id.toString());
      
      if (values.description) {
        formData.append("description", values.description);
      }
      
      if (values.eventId) {
        formData.append("eventId", values.eventId);
      }
      
      if (values.cfpSubmissionId) {
        formData.append("cfpSubmissionId", values.cfpSubmissionId);
      }

      await apiRequest("/api/assets", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary for multipart/form-data
        headers: {},
      });

      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      
      toast({
        title: "Asset uploaded",
        description: "Your asset has been uploaded successfully.",
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your asset.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter asset name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your asset
              </FormDescription>
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
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="bio">Biography</SelectItem>
                  <SelectItem value="headshot">Headshot</SelectItem>
                  <SelectItem value="trip_report">Trip Report</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Categorize your asset for easier organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description for your asset"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about the asset
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Event</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select related event (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {events?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Associate this asset with an event
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cfpSubmissionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related CFP Submission</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select related CFP submission (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cfpSubmissions?.map((submission: any) => (
                    <SelectItem key={submission.id} value={submission.id.toString()}>
                      {submission.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Associate this asset with a CFP submission
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange(file);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                Upload your file (max 10MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}