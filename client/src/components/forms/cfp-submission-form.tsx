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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, Send } from "lucide-react";

const createCfpSubmissionSchema = (t: (key: string, params?: any) => string) => z.object({
  eventId: z.number().min(1, t("cfp.validation.eventRequired")),
  title: z.string().min(1, t("cfp.validation.titleRequired")),
  abstract: z.string().min(10, t("cfp.validation.abstractRequired")),
  submitterName: z.string().min(1, t("cfp.validation.submitterNameRequired")),
  status: z.enum(["draft", "submitted", "accepted", "rejected", "withdrawn"]),
  submissionDate: z.string().optional(),
  notes: z.string().optional(),
});

interface CfpSubmissionFormProps {
  onSuccess?: () => void;
}

export const CfpSubmissionForm: FC<CfpSubmissionFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation(["cfp", "forms", "common"]);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const cfpSubmissionSchema = createCfpSubmissionSchema(t);
  type CfpSubmissionFormData = z.infer<typeof cfpSubmissionSchema>;

  // Fetch events for dropdown
  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to load events');
      return response.json();
    },
  });

  const form = useForm<CfpSubmissionFormData>({
    resolver: zodResolver(cfpSubmissionSchema),
    defaultValues: {
      title: "",
      abstract: "",
      submitterName: "",
      status: "draft",
      notes: "",
    },
  });

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: CfpSubmissionFormData) => {
      const submissionData = {
        ...data,
        submissionDate: data.status === "submitted" ? new Date().toISOString().split('T')[0] : null,
      };
      const response = await apiRequest("POST", "/api/cfp-submissions", submissionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfp-submissions'] });
      form.reset();
      setOpen(false);
      toast({
        title: t("cfp.messages.created"),
        description: t("cfp.messages.createdDescription"),
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("cfp.messages.submissionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CfpSubmissionFormData) => {
    createSubmissionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("cfp.submitCfp")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("cfp.submissionTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cfp.fields.event")}</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("cfp.placeholders.selectEvent")} />
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cfp.fields.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("cfp.placeholders.title")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cfp.fields.submitterName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("cfp.placeholders.submitterName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cfp.fields.abstract")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("cfp.placeholders.abstract")}
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("cfp.fields.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("cfp.placeholders.selectStatus")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t("cfp.statuses.draft")}</SelectItem>
                      <SelectItem value="submitted">{t("cfp.statuses.submitted")}</SelectItem>
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
                  <FormLabel>{t("cfp.fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("cfp.placeholders.notes")}
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
                disabled={createSubmissionMutation.isPending}
              >
                {createSubmissionMutation.isPending ? (
                  t("common.saving")
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {form.watch("status") === "submitted" ? t("cfp.submitCfp") : t("common.saveDraft", "Save Draft")}
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