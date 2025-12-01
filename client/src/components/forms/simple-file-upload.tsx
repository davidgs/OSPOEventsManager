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

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Loader2, Upload, Calendar, Plus } from "lucide-react";
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

// Schemas will be created with translations
const createAssetUploadSchema = (t: (key: string, params?: any) => string) => z.object({
  name: z.string().min(3, t("assets.validation.nameRequired")),
  type: z.enum(assetTypes as unknown as [string, ...string[]]),
  description: z.string().min(10, t("forms.validation.minLength", { min: 10 })),
  eventId: z.number().optional(),
  cfpSubmissionId: z.number().optional(),
  content: z.string().optional(),
  uploadMethod: z.enum(["file", "text"]),
  file: z
    .instanceof(FileList)
    .optional()
    .refine((files) => {
      if (files && files.length > 0) {
        return files[0].size <= MAX_FILE_SIZE;
      }
      return true;
    }, t("assets.validation.fileSizeExceeded", { size: formatBytes(MAX_FILE_SIZE) }))
    .refine((files) => {
      if (files && files.length > 0) {
        return ACCEPTED_FILE_TYPES.includes(files[0].type);
      }
      return true;
    }, t("assets.validation.fileTypeNotSupported"))
    .refine((files) => {
      return true; // Handle this in form submission instead
    }, t("assets.validation.fileSelectRequired")),
});

const createNewEventSchema = (t: (key: string, params?: any) => string) => z.object({
  name: z.string().min(3, t("events.validation.nameRequired")),
  link: z.string().url(t("events.validation.linkInvalid")),
  startDate: z.string().min(1, t("events.validation.startDateRequired")),
  endDate: z.string().min(1, t("events.validation.endDateRequired")),
  cfpDeadline: z.string().optional(),
  location: z.string().min(3, t("events.validation.locationRequired")),
  type: z.enum(eventTypes as unknown as [string, ...string[]]),
  priority: z.enum(eventPriorities as unknown as [string, ...string[]]),
  goals: z.array(z.string()).min(1, t("events.validation.goalRequired")),
});

type AssetUploadFormProps = {
  onComplete: () => void;
};

export function SimpleFileUploadForm({ onComplete }: AssetUploadFormProps) {
  const { t } = useTranslation(["assets", "events", "forms", "common", "modals"]);
  const { toast } = useToast();
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);

  const assetUploadSchema = createAssetUploadSchema(t);
  const newEventSchema = createNewEventSchema(t);
  type AssetUploadFormValues = z.infer<typeof assetUploadSchema>;
  type NewEventFormValues = z.infer<typeof newEventSchema>;

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
  const { data: eventsData } = useQuery({
    queryKey: ["/api/events"],
  });

  // Define proper type for events
  const events = Array.isArray(eventsData) ? eventsData : [];

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
        title: t("forms.events.created"),
        description: t("forms.events.createdDescription"),
      });

      // Close dialog and select the new event
      setShowAddEventDialog(false);

      // Set the event ID in the asset form
      form.setValue("eventId", data.id);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("forms.events.creationFailedDescription", { error: error.message }),
        variant: "destructive",
      });
    },
  });

  // Asset upload mutation
  const upload = useMutation({
    mutationFn: async (values: AssetUploadFormValues) => {
      if (values.uploadMethod === "text") {
        // Direct text upload using fetch instead of apiRequest to avoid type issues
        const response = await fetch("/api/assets", {
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

        if (!response.ok) {
          throw new Error("Failed to upload asset");
        }

        return response;
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
        title: t("assets.messages.uploaded"),
        description: t("assets.messages.uploadedDescription"),
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: t("assets.messages.uploadFailed"),
        description: t("assets.messages.uploadFailedDescription", { error: error.message }),
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
        message: t("assets.validation.fileSelectRequired"),
      });
      return;
    }

    if (values.uploadMethod === "text" && (!values.content || values.content.trim() === "")) {
      form.setError("content", {
        type: "manual",
        message: t("assets.validation.contentRequired"),
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
                <FormLabel>{t("assets.fields.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("assets.placeholders.name")} {...field} />
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
                <FormLabel>{t("assets.fields.type")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("assets.placeholders.selectType")} />
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
                <FormLabel>{t("assets.fields.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("assets.placeholders.description")}
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
                <FormLabel>{t("assets.fields.event")}</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t("assets.placeholders.selectEvent")} ({t("common.optional")})" />
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
                    title={t("modals.addEvent.title")}
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
              <TabsTrigger value="file">{t("assets.uploadFile")}</TabsTrigger>
              <TabsTrigger value="text">{t("assets.enterText")}</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-0">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>{t("assets.fields.file")}</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Simplified file upload button */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <label htmlFor="simple-file-upload" className="block w-full h-full cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-medium">{t("assets.selectFile")}</p>
                            <p className="text-xs text-gray-500">{t("assets.filesUpTo", { size: formatBytes(MAX_FILE_SIZE) })}</p>
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
                                  {t("assets.messages.remove")}
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
                    <FormLabel>{t("assets.fields.content")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("assets.placeholders.content")}
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

          {/* Fixed position action buttons for better accessibility on mobile/iPad */}
          <div className="sticky bottom-0 left-0 right-0 bg-background pt-4 pb-2 border-t mt-6">
            <div className="flex justify-between sm:justify-end gap-4 px-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-initial"
                onClick={onComplete}
              >
                {t("forms.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={upload.isPending}
                className="flex-1 sm:flex-initial"
              >
                {upload.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("assets.uploading")}
                  </>
                ) : (
                  t("assets.uploadAsset")
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Add New Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-md pt-8 pb-0 px-4 overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>{t("modals.addEvent.title")}</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <Form {...newEventForm}>
              <form onSubmit={newEventForm.handleSubmit(onSubmitNewEvent)} className="space-y-4">
                <FormField
                control={newEventForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.fields.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.name")} {...field} />
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
                    <FormLabel>{t("events.fields.website")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.link")} {...field} />
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
                      <FormLabel>{t("events.fields.startDate")}</FormLabel>
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
                      <FormLabel>{t("events.fields.endDate")}</FormLabel>
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
                    <FormLabel>{t("events.fields.location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.location")} {...field} />
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
                      <FormLabel>{t("events.fields.type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("events.placeholders.selectType")} />
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
                      <FormLabel>{t("events.fields.priority")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("events.placeholders.selectPriority")} />
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
                      <FormLabel>{t("events.fields.goals")}</FormLabel>
                      <FormDescription>
                        {t("common.selectAllThatApply")}
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

              {/* Fixed position action buttons for better accessibility on iPad */}
              <div className="sticky bottom-0 left-0 right-0 bg-background pt-4 pb-2 border-t mt-6">
                <div className="flex justify-between sm:justify-end gap-4 px-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                    onClick={() => setShowAddEventDialog(false)}
                  >
                    {t("forms.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEvent.isPending}
                    className="flex-1 sm:flex-initial"
                  >
                    {createEvent.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.creating")}
                      </>
                    ) : (
                      t("events.addEvent")
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}