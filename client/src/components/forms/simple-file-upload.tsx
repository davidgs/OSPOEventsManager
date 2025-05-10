import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { assetTypes, eventTypes, eventPriorities } from "@shared/schema";
import { formatBytes } from "@/lib/utils";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  "application/zip"
];

// Schemas for validation
const assetUploadSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(assetTypes as unknown as [string, ...string[]]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  eventId: z.number().optional(),
  cfpSubmissionId: z.number().optional(),
  content: z.string().optional(),
  uploadMethod: z.enum(["file", "text"]).default("file"),
  file: z
    .instanceof(FileList)
    .optional()
    .refine((files) => {
      if (files && files.length > 0) {
        return files[0].size <= MAX_FILE_SIZE;
      }
      return true;
    }, `Max file size is ${formatBytes(MAX_FILE_SIZE)}`)
    .refine((files) => {
      if (files && files.length > 0) {
        return ACCEPTED_FILE_TYPES.includes(files[0].type);
      }
      return true;
    }, "File type not supported")
    .superRefine((files, ctx) => {
      // If upload method is file, make sure file is provided
      if (ctx.parent.uploadMethod === "file") {
        if (!files || files.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a file",
          });
        }
      }
    }),
});

const newEventSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  link: z.string().url("Please enter a valid URL"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  cfpDeadline: z.string().optional(),
  location: z.string().min(3, "Location must be at least 3 characters"),
  type: z.enum(eventTypes as unknown as [string, ...string[]]),
  priority: z.enum(eventPriorities as unknown as [string, ...string[]]),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
});

type AssetUploadFormProps = {
  onComplete: () => void;
};

type AssetUploadFormValues = z.infer<typeof assetUploadSchema>;
type NewEventFormValues = z.infer<typeof newEventSchema>;

export function SimpleFileUploadForm({ onComplete }: AssetUploadFormProps) {
  const { toast } = useToast();
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  
  // Form setup
  const form = useForm<AssetUploadFormValues>({
    resolver: zodResolver(assetUploadSchema),
    defaultValues: {
      name: "",
      type: "abstract",
      description: "",
      uploadMethod: "file",
    },
  });
  
  // New event form setup
  const newEventForm = useForm<NewEventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      name: "",
      link: "",
      startDate: "",
      endDate: "",
      cfpDeadline: "",
      location: "",
      type: "conference",
      priority: "medium",
      goals: ["attending"],
    },
  });
  
  // Fetch events for dropdown
  const { data: events = [] } = useQuery({ 
    queryKey: ["/api/events"],
  });
  
  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (values: NewEventFormValues) => {
      // Handle date formatting
      const formattedValues = {
        ...values,
        goals: JSON.stringify(values.goals),
      };
      
      const response = await fetch("/api/events", {
        method: "POST",
        body: JSON.stringify(formattedValues),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to create event");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Created",
        description: "Event has been created successfully",
      });
      
      // Close dialog and select the new event
      setShowAddEventDialog(false);
      
      // Set the event ID in the asset form
      form.setValue("eventId", data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Asset upload mutation
  const upload = useMutation({
    mutationFn: async (values: AssetUploadFormValues) => {
      if (values.uploadMethod === "text") {
        // Direct text upload
        return await apiRequest("/api/assets", {
          method: "POST",
          body: JSON.stringify({
            name: values.name,
            type: values.type,
            description: values.description,
            eventId: values.eventId || null,
            cfpSubmissionId: values.cfpSubmissionId || null,
            content: values.content,
            isTextContent: true,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        // File upload using FormData
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("type", values.type);
        formData.append("description", values.description);
        
        if (values.eventId) {
          formData.append("eventId", values.eventId.toString());
        }
        
        if (values.cfpSubmissionId) {
          formData.append("cfpSubmissionId", values.cfpSubmissionId.toString());
        }
        
        if (values.file && values.file.length > 0) {
          formData.append("file", values.file[0]);
        }
        
        return await fetch("/api/assets", {
          method: "POST",
          body: formData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Asset uploaded successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload asset. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Event creation submission handler
  const onSubmitNewEvent = (values: NewEventFormValues) => {
    createEvent.mutate(values);
  };
  
  // Asset submission handler
  const onSubmit = (values: AssetUploadFormValues) => {
    if (values.uploadMethod === "file" && (!values.file || values.file.length === 0)) {
      form.setError("file", {
        type: "manual",
        message: "Please select a file",
      });
      return;
    }
    
    if (values.uploadMethod === "text" && (!values.content || values.content.trim() === "")) {
      form.setError("content", {
        type: "manual",
        message: "Content cannot be empty",
      });
      return;
    }
    
    upload.mutate(values);
  };
  
  // Simple file handling function
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("file", e.target.files);
      form.setValue("uploadMethod", "file");
      form.trigger("file");
    }
  };

  return (
    <>
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
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe this asset"
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
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
                <div className="flex gap-2">
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select event (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button"
                    size="icon"
                    onClick={() => setShowAddEventDialog(true)}
                    title="Add New Event"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Tabs defaultValue="file" onValueChange={(value) => form.setValue("uploadMethod", value as "file" | "text")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="text">Enter Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-0">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Simplified file upload button */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <label htmlFor="simple-file-upload" className="block w-full h-full cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-medium">Click to select a file</p>
                            <p className="text-xs text-gray-500">Maximum size: {formatBytes(MAX_FILE_SIZE)}</p>
                          </label>
                          <input
                            id="simple-file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileSelect}
                            accept={ACCEPTED_FILE_TYPES.join(",")}
                            {...rest}
                          />
                        </div>
                        
                        {/* File preview */}
                        {(() => {
                          const files = form.getValues("file");
                          if (files && files.length > 0 && files[0]) {
                            return (
                              <div className="p-3 bg-secondary rounded flex items-center justify-between text-sm">
                                <span className="truncate max-w-xs">
                                  {files[0].name} ({formatBytes(files[0].size)})
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    form.setValue("file", undefined);
                                    form.trigger("file");
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="text" className="mt-0">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your content here..." 
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

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
      
      {/* Add New Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          
          <Form {...newEventForm}>
            <form onSubmit={newEventForm.handleSubmit(onSubmitNewEvent)} className="space-y-4">
              <FormField
                control={newEventForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Event name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newEventForm.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newEventForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newEventForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newEventForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newEventForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newEventForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventPriorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newEventForm.control}
                name="goals"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Goals</FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["speaking", "sponsoring", "attending", "exhibiting"].map((goal) => (
                        <FormField
                          key={goal}
                          control={newEventForm.control}
                          name="goals"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(goal)}
                                    onCheckedChange={(checked) => {
                                      const updatedGoals = checked 
                                        ? [...field.value, goal]
                                        : field.value?.filter((value) => value !== goal);
                                      field.onChange(updatedGoals);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => setShowAddEventDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Add Event"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}