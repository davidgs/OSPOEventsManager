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

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { eventPriorities, eventTypes, eventGoals } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

// Form schema will be created with translations
const createFormSchema = (t: (key: string, params?: any) => string) => z.object({
  name: z.string().min(1, t("events.validation.nameRequired")),
  link: z.string().url(t("events.validation.linkInvalid")),
  location: z.string().min(1, t("events.validation.locationRequired")),
  priority: z.enum(eventPriorities),
  type: z.enum(eventTypes),
  goal: z.array(z.enum(eventGoals)).min(1, t("events.validation.goalRequired")),
  start_date: z.date({ required_error: t("events.validation.startDateRequired") }),
  end_date: z.date({ required_error: t("events.validation.endDateRequired") }),
  cfp_deadline: z.date().optional().nullable(),
  notes: z.string().optional(),
});

const AddEventModal: FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation(["events", "modals", "forms", "common"]);
  const formSchema = createFormSchema(t);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      link: "",
      location: "",
      priority: "medium",
      type: "conference",
      goal: ["attending"], // Default to attending, now as an array
      notes: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert Date objects to ISO strings for API submission
    const formattedData = {
      ...data,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date.toISOString().split('T')[0],
      cfp_deadline: data.cfp_deadline ? data.cfp_deadline.toISOString().split('T')[0] : null,
    };

    onSubmit(formattedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>{t("modals.addEvent.title")}</DialogTitle>
          <DialogDescription>
            {t("modals.addEvent.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("events.fields.name")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.name")} {...field} />
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
                    <FormLabel>{t("events.fields.website")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.link")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.fields.startDate")} <span className="text-red-500">*</span></FormLabel>
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
                              <span>{t("common.selectDate")}</span>
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
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.fields.endDate")} <span className="text-red-500">*</span></FormLabel>
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
                              <span>{t("common.selectDate")}</span>
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("events.fields.location")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t("events.placeholders.location")} {...field} />
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
                    <FormLabel>{t("events.fields.priority")} <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Event Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.fields.type")} <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Event Goals - using checkboxes for multiple selection */}
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("events.fields.goals")} <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {eventGoals.map((goal) => (
                        <FormItem key={goal} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(goal)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, goal]);
                                } else {
                                  field.onChange(
                                    currentValue.filter(
                                      (value: string) => value !== goal
                                    )
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {goal.charAt(0).toUpperCase() + goal.slice(1)}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormDescription>
                      {t("common.selectAllThatApply")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CFP Deadline */}
              <FormField
                control={form.control}
                name="cfp_deadline"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("events.fields.cfpDeadline")}</FormLabel>
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
                              <span>{t("common.selectDate")} ({t("common.optional")})</span>
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
                      {t("events.fields.cfpDeadline")}
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
                    <FormLabel>{t("events.fields.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("events.placeholders.notes")}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("common.optional")}: {t("events.placeholders.notes")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            <DialogFooter className="px-6 pt-4 pb-6 flex-shrink-0 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("forms.buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("events.addEvent")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventModal;