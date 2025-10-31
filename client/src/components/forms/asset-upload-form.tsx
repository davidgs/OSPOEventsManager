import { useState, useRef, useEffect } from "react";
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
import { Loader2, Upload, Plus, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  "text/plain",
  "application/zip",
  "application/prf",
  "application/x-prf"
];

type AssetUploadFormProps = {
  onComplete: () => void;
};

const assetUploadSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  type: z.enum(assetTypes as unknown as [string, ...string[]]),
  description: z.string().optional(),
  eventId: z.string().optional(),
  cfpSubmissionId: z.string().optional(),
  content: z.string().optional(),
  uploadMethod: z.enum(["file", "text"]),
  file: z.instanceof(FileList).optional()
    .superRefine((files, ctx) => {
      // File validation is handled at form level based on uploadMethod

      if (files && files.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File is required",
        });
        return;
      }

      if (files && files.length > 0) {
        if (files[0].size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File size must be less than ${formatBytes(MAX_FILE_SIZE)}`,
          });
        }

        if (!ACCEPTED_FILE_TYPES.includes(files[0].type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "File type not supported",
          });
        }
      }
    }),
});

// Schema for the new event form
const newEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  link: z.string().url("Please enter a valid URL"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  location: z.string().min(1, "Location is required"),
  priority: z.enum(eventPriorities as unknown as [string, ...string[]]),
  type: z.enum(eventTypes as unknown as [string, ...string[]]),
  goals: z.array(z.string()).min(1, "At least one goal is required"),
  cfpDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  notes: z.string().optional(),
});

type AssetUploadFormValues = z.infer<typeof assetUploadSchema>;
type NewEventFormValues = z.infer<typeof newEventSchema>;

export function AssetUploadForm({ onComplete }: AssetUploadFormProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEventSelection, setShowEventSelection] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current user
  const { data: currentUser } = useQuery<{ id: number } | undefined>({
    queryKey: ["/api/users/2"]
  });

  // Fetch events for dropdown
  const { data: events = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/events"]
  });

  const form = useForm<AssetUploadFormValues>({
    resolver: zodResolver(assetUploadSchema),
    defaultValues: {
      name: "",
      type: "other",
      description: "",
      eventId: "",
      cfpSubmissionId: "",
      uploadMethod: "file",
      content: ""
    },
  });

  // New event form
  const newEventForm = useForm<NewEventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      name: "",
      link: "",
      startDate: new Date().toISOString().split('T')[0], // Today
      endDate: new Date().toISOString().split('T')[0], // Today
      location: "",
      priority: "medium",
      type: "conference",
      goals: ["attending"],
      cfpDeadline: null,
      notes: "",
    },
  });

  // Check if asset type should show event selection and set upload method
  useEffect(() => {
    const assetType = form.watch("type");
    // Show event selection for these asset types
    if (assetType === "abstract" || assetType === "trip_report" || assetType === "presentation") {
      setShowEventSelection(true);
    } else {
      setShowEventSelection(false);
    }

    // Set default upload method to text for these asset types
    if (assetType === "abstract" || assetType === "trip_report" || assetType === "bio") {
      form.setValue("uploadMethod", "text");
    } else {
      form.setValue("uploadMethod", "file");
    }
  }, [form.watch("type")]);

  // Create a new event
  const createEvent = useMutation({
    mutationFn: async (values: NewEventFormValues) => {
      const response = await apiRequest("POST", "/api/events", values);
      if (!response.ok) {
        throw new Error("Failed to create event");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowAddEventDialog(false);

      // Set the new event ID in the asset form
      if (data && typeof data === 'object' && 'id' in data) {
        form.setValue("eventId", data.id.toString());
      }
    },
    onError: (error) => {
      toast({
        title: "Event creation failed",
        description: `There was an error creating the event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle submitting the new event form
  const onSubmitNewEvent = (values: NewEventFormValues) => {
    createEvent.mutate(values);
  };

  // Upload asset
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

      // For text content
      if (values.uploadMethod === "text" && values.content) {
        formData.append("content", values.content);

        // Create a text file from the content
        const textBlob = new Blob([values.content], { type: "text/plain" });
        const textFile = new File([textBlob], `${values.name}.txt`, { type: "text/plain" });
        formData.append("file", textFile);
      } else if (values.uploadMethod === "file" && values.file && values.file.length > 0) {
        // Add the file
        formData.append("file", values.file[0]);
      }

      // Add the current user ID
      if (currentUser) {
        formData.append("uploadedBy", currentUser.id.toString());
      }

      return apiRequest("POST", "/api/assets", formData);
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
    // Validate that file or content is provided
    if (values.uploadMethod === "file" && (!values.file || values.file.length === 0)) {
      form.setError("file", { message: "Please select a file to upload" });
      return;
    }

    if (values.uploadMethod === "text" && (!values.content || values.content.trim() === "")) {
      form.setError("content", { message: "Please enter content for the asset" });
      return;
    }

    // Check if event is required but not selected
    if (showEventSelection && !values.eventId) {
      toast({
        title: "Event required",
        description: "Please select an event or create a new one for this asset type.",
        variant: "destructive",
      });
      return;
    }

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
      form.setValue("uploadMethod", "file");
      form.trigger("file");
    }
  };

  // Triggers when file is selected with click
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("file", e.target.files);
      form.setValue("uploadMethod", "file");
      form.trigger("file");
    }
  };

  // Triggers the input when the button is clicked
  const onButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.click();
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    // If type changes, reset the upload method
                    if (value === "abstract" || value === "trip_report") {
                      form.setValue("uploadMethod", "text");
                    }
                  }}
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

          {showEventSelection && (
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <div className="flex space-x-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events?.map((event) => (
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
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    This asset must be linked to an event. If the event isn't listed, click the + button to create it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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

          {(form.watch("type") === "abstract" || form.watch("type") === "trip_report" || form.watch("type") === "bio") && (
            <FormField
              control={form.control}
              name="uploadMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text">Enter Text</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id="file" />
                        <Label htmlFor="file">Upload File</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Tabs
            value={form.watch("uploadMethod")}
            onValueChange={(value) => form.setValue("uploadMethod", value as "file" | "text")}
            className="w-full"
          >
            <TabsList className="hidden">
              <TabsTrigger value="file">File</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
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
                        {/* iOS-compatible file upload approach */}
                        <div className="space-y-4">
                          {/* Input element in view - iOS requires the input to be visible */}
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start px-3 py-8 h-auto"
                              onClick={(e) => {
                                e.preventDefault();
                                if (inputRef.current) {
                                  inputRef.current.click();
                                }
                              }}
                            >
                              <div className="flex items-center w-full">
                                <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
                                <div className="text-left">
                                  <p className="font-medium">Select a file to upload</p>
                                  <p className="text-muted-foreground text-sm">
                                    Files up to {formatBytes(MAX_FILE_SIZE)}
                                  </p>
                                </div>
                              </div>
                            </Button>

                            <div className="relative">
                              <input
                                type="file"
                                id="file-upload-input"
                                className="absolute inset-0 w-0 h-0 opacity-0"
                                ref={inputRef}
                                onChange={handleChange}
                                accept={ACCEPTED_FILE_TYPES.join(",")}
                              />
                            </div>
                          </div>
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
                      <FormField
                        control={newEventForm.control}
                        name="goals"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("speaking")}
                                  onCheckedChange={(checked) => {
                                    const updatedGoals = checked
                                      ? [...field.value, "speaking"]
                                      : field.value?.filter((value) => value !== "speaking");
                                    field.onChange(updatedGoals);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Speaking
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={newEventForm.control}
                        name="goals"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("sponsoring")}
                                  onCheckedChange={(checked) => {
                                    const updatedGoals = checked
                                      ? [...field.value, "sponsoring"]
                                      : field.value?.filter((value) => value !== "sponsoring");
                                    field.onChange(updatedGoals);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Sponsoring
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={newEventForm.control}
                        name="goals"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("attending")}
                                  onCheckedChange={(checked) => {
                                    const updatedGoals = checked
                                      ? [...field.value, "attending"]
                                      : field.value?.filter((value) => value !== "attending");
                                    field.onChange(updatedGoals);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Attending
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={newEventForm.control}
                        name="goals"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("exhibiting")}
                                  onCheckedChange={(checked) => {
                                    const updatedGoals = checked
                                      ? [...field.value, "exhibiting"]
                                      : field.value?.filter((value) => value !== "exhibiting");
                                    field.onChange(updatedGoals);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Exhibiting
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newEventForm.control}
                name="cfpDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CFP Deadline (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          className="pl-10"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newEventForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this event"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
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
                      Creating Event...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}