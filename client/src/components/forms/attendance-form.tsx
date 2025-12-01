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

import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, UserPlus } from "lucide-react";

const createAttendanceSchema = (t: (key: string, params?: any) => string) =>
  z.object({
    eventId: z
      .number()
      .min(
        1,
        t("attendees.validation.eventRequired", "Please select an event")
      ),
    name: z
      .string()
      .min(1, t("forms.validation.nameRequired", "Name is required")),
    email: z
      .string()
      .email(t("forms.validation.email"))
      .optional()
      .or(z.literal("")),
    role: z.string().optional(),
    notes: z.string().optional(),
  });

interface AttendanceFormProps {
  onSuccess?: () => void;
}

export const AttendanceForm: FC<AttendanceFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation(["attendees", "forms", "common"]);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const attendanceSchema = createAttendanceSchema(t);
  type AttendanceFormData = z.infer<typeof attendanceSchema>;

  // Fetch events for dropdown
  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to load events");
      return response.json();
    },
  });

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      notes: "",
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormData) => {
      const response = await apiRequest("POST", "/api/attendees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      form.reset();
      setOpen(false);
      toast({
        title: t("attendees.messages.registered"),
        description: t("attendees.messages.registeredDescription"),
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("attendees.messages.registrationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AttendanceFormData) => {
    createAttendanceMutation.mutate(data);
  };

  const roleOptions = [
    { value: "attendee", label: t("attendees.roles.attendee") },
    { value: "speaker", label: t("attendees.roles.speaker") },
    { value: "sponsor", label: t("attendees.roles.sponsor") },
    { value: "organizer", label: t("attendees.roles.organizer") },
    { value: "volunteer", label: t("attendees.roles.volunteer") },
    { value: "media", label: t("attendees.roles.media") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("attendees.registerAttendance")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("attendees.registerAttendance")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendees.fields.event")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("attendees.placeholders.selectEvent")}
                        />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendees.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("attendees.placeholders.name")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendees.fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("attendees.placeholders.email")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendees.fields.role")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("attendees.placeholders.selectRole")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("attendees.fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("attendees.placeholders.notes")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("forms.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createAttendanceMutation.isPending}
              >
                {createAttendanceMutation.isPending ? (
                  t("common.registering", "Registering...")
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("attendees.registerAttendance")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
