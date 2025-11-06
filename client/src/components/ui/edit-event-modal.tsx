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

import { FC, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  insertEventSchema,
  eventPriorities,
  eventTypes,
  eventGoals,
  EventGoal,
  Event,
} from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { safeParseDate } from "@/lib/date-utils";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: any) => void;
  event: Event | null;
  isSubmitting: boolean;
}

// Create a client-side form schema with Date objects for better UX
const formSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    link: z.string().url("Must be a valid URL"),
    location: z.string().min(1, "Location is required"),
    priority: z.enum(eventPriorities),
    type: z.enum(eventTypes),
    goals: z.array(z.enum(eventGoals)).optional(),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    cfpDeadline: z.date().optional().nullable(),
    notes: z.string().nullable().optional(),
    createdById: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      return !data.endDate || !data.startDate || data.endDate >= data.startDate;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      return (
        !data.cfpDeadline ||
        !data.startDate ||
        data.startDate >= data.cfpDeadline
      );
    },
    {
      message: "CFP deadline should be before the event start date",
      path: ["cfpDeadline"],
    }
  );

const EditEventModal: FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  isSubmitting,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      link: "",
      location: "",
      priority: "medium",
      type: "conference",
      goals: [],
      notes: "",
    },
  });

  // Update form when event changes
  useEffect(() => {
    if (event) {
      // Parse goals from string to array if needed
      let eventGoalsArray: EventGoal[] = [];
      if (typeof event.goal === "string") {
        try {
          // Try to parse the JSON string
          eventGoalsArray = JSON.parse(event.goal) as EventGoal[];
        } catch (e) {
          // If parsing fails, assume it's a single goal and convert to array
          eventGoalsArray = [event.goal as unknown as EventGoal];
        }
      } else if (Array.isArray(event.goal)) {
        eventGoalsArray = event.goal as EventGoal[];
      } else if (event.goal) {
        // Fallback to legacy goal field if available
        eventGoalsArray = [event.goal as unknown as EventGoal];
      }

      console.log("Event goals parsed:", eventGoalsArray);

      form.reset({
        name: event.name,
        link: event.link,
        location: event.location,
        priority: event.priority as "essential" | "high" | "medium" | "low" | "nice to have",
        type: event.type as "conference" | "meetup" | "webinar" | "workshop" | "hackathon",
        goals: eventGoalsArray,
        startDate: safeParseDate(event.start_date) || new Date(),
        endDate: safeParseDate(event.end_date) || new Date(),
        cfpDeadline: safeParseDate(event.cfp_deadline) || undefined,
        notes: event.notes || undefined,
      });
    }
  }, [event, form]);

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("🎯 EditEventModal handleSubmit called with data:", data);
    if (event) {
      // Convert Date objects to ISO strings for API submission
      const formattedData = {
        name: data.name,
        link: data.link,
        location: data.location,
        priority: data.priority,
        type: data.type,
        goal: data.goals || [], // Convert goals to goal and handle optional
        start_date: data.startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        end_date: data.endDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        cfp_deadline: data.cfpDeadline
          ? data.cfpDeadline.toISOString().split("T")[0]
          : undefined, // Format as YYYY-MM-DD if exists
        notes: data.notes,
      };

      // Debugging logs
      console.log("Raw form data:", data);
      console.log("Formatted data for API:", formattedData);
      console.log("Date format samples:", {
        rawStartDate: data.startDate,
        formattedStartDate: formattedData.start_date,
        dateConstructorTest: new Date(formattedData.start_date).toISOString(),
      });

      console.log("🚀 Calling onSubmit with event.id:", event.id);
      onSubmit(event.id, formattedData);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Form submit event triggered");
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("Form values:", form.getValues());
    console.log("Goals array details:", {
      goals: form.getValues().goals,
      goalsType: typeof form.getValues().goals,
      goalsLength: form.getValues().goals?.length,
      goalsContent: form.getValues().goals,
    });

    // Trigger form validation and submit
    form.handleSubmit(handleSubmit)(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details of the event.
          </DialogDescription>
        </DialogHeader>

        {event && (
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Event Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>
                        Event Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Website */}
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>
                        Event Website <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Location <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, Country or Virtual"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Priority <span className="text-red-500">*</span>
                      </FormLabel>
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
                              {priority.charAt(0).toUpperCase() +
                                priority.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Event Type <span className="text-red-500">*</span>
                      </FormLabel>
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

                {/* Event Goals - Using Checkboxes */}
                <FormField
                  control={form.control}
                  name="goals"
                  render={() => (
                    <FormItem className="sm:col-span-2">
                      <div className="mb-4">
                        <FormLabel>Event Goals</FormLabel>
                        <FormDescription>
                          Select all goals that apply to this event
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        {eventGoals.map((goal) => (
                          <FormField
                            key={goal}
                            control={form.control}
                            name="goals"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={goal}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(goal)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = Array.isArray(
                                          field.value
                                        )
                                          ? [...field.value]
                                          : [];
                                        return checked
                                          ? field.onChange([
                                              ...currentValues,
                                              goal,
                                            ])
                                          : field.onChange(
                                              currentValues.filter(
                                                (value) => value !== goal
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {goal.charAt(0).toUpperCase() +
                                      goal.slice(1)}
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

                {/* CFP Deadline */}
                <FormField
                  control={form.control}
                  name="cfpDeadline"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>CFP Deadline</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date (optional)</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormDescription>
                        The deadline for Call for Proposals submissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional details or notes about the event"
                          className="min-h-[100px]"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Add any important notes or context about this
                        event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Update Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
