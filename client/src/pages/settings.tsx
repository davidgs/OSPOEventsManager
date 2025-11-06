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

import { FC, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Bell,
  UserRound,
  KeyRound,
  ShieldCheck,
  Send,
  HelpCircle,
  Save,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().max(160).optional(),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
  jobTitle: z.string().min(2, {
    message: "Job title must be at least 2 characters.",
  }),
});

const notificationFormSchema = z.object({
  email_notifications: z.boolean(),
  cfp_deadline_reminders: z.boolean(),
  cfp_status_updates: z.boolean(),
  new_cfp_digest: z.boolean(),
  event_reminders: z.boolean(),
});

const SettingsPage: FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const userId = 2; // Using demo_user's ID

  // Query to fetch user data
  const { data: userData, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      role: "",
      jobTitle: "",
    },
    values: userData
      ? {
          name: userData.name || "",
          email: userData.email || "",
          bio: userData.bio || "",
          role: userData.role || "",
          jobTitle: userData.job_title || "",
        }
      : undefined,
  });

  // Notifications form
  type NotificationFormData = z.infer<typeof notificationFormSchema>;
  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      email_notifications: true,
      cfp_deadline_reminders: true,
      cfp_status_updates: true,
      new_cfp_digest: false,
      event_reminders: true,
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: z.infer<typeof profileFormSchema>) => {
      // Transform camelCase to snake_case for backend
      const transformedData = {
        ...data,
        job_title: data.jobTitle,
        jobTitle: undefined, // Remove the camelCase version
      };
      return apiRequest(
        "PUT",
        `/api/users/${userId}/profile`,
        transformedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    profileMutation.mutate(data);
  };

  // Handle headshot upload
  const handleHeadshotUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the 10MB limit.");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and GIF images are allowed.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("headshot", file);

      const response = await fetch(`/api/users/${userId}/headshot`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload headshot");
      }

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Headshot Uploaded",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      setUploadError(error.message || "Error uploading headshot");
      toast({
        title: "Upload Error",
        description:
          error.message || "Failed to upload headshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle headshot remove
  const handleRemoveHeadshot = async () => {
    try {
      await apiRequest("PUT", `/api/users/${userId}/profile`, {
        headshot: null,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Headshot Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to remove headshot. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle notification form submission
  const onNotificationSubmit = (
    data: z.infer<typeof notificationFormSchema>
  ) => {
    // This would call an API in a real implementation
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar on desktop, Tabs on mobile */}
          <div className="md:hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="profile" className="text-sm">
                  <UserRound className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="hidden md:block">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </h3>
                  <Separator />
                </div>
                <div className="mt-4 space-y-1">
                  <Button
                    variant={activeTab === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start text-base"
                    onClick={() => setActiveTab("profile")}
                  >
                    <UserRound className="mr-2 h-5 w-5" />
                    Profile
                  </Button>
                  <Button
                    variant={
                      activeTab === "notifications" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start text-base"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="mr-2 h-5 w-5" />
                    Notifications
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "secondary" : "ghost"}
                    className="w-full justify-start text-base"
                    onClick={() => setActiveTab("security")}
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Security
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base text-gray-700"
                    >
                      <HelpCircle className="mr-2 h-5 w-5" />
                      Help & Support
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base text-gray-700"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      Send Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div>
            {activeTab === "profile" && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your personal information and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Your email address"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Your email address will be used for
                                notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="community_architect">
                                    Community Architect
                                  </SelectItem>
                                  <SelectItem value="developer_advocate">
                                    Developer Advocate
                                  </SelectItem>
                                  <SelectItem value="community_manager">
                                    Community Manager
                                  </SelectItem>
                                  <SelectItem value="ospo_lead">
                                    OSPO Lead
                                  </SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Your role in the organization.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="jobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your job title"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Your professional title or position.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us a little about yourself"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                A brief description about yourself and your
                                work.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Profile Photo Upload */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-base font-medium">
                              Profile Photo
                            </h3>
                            <p className="text-sm text-gray-500">
                              Your profile photo will be displayed on your
                              profile and in attendee lists.
                            </p>
                          </div>

                          <div className="flex items-center gap-5">
                            <Avatar className="h-20 w-20">
                              {userData?.headshot ? (
                                <AvatarImage
                                  src={userData.headshot}
                                  alt={userData.name || "Profile"}
                                />
                              ) : (
                                <AvatarFallback className="text-lg">
                                  {userData?.name
                                    ? userData.name.charAt(0).toUpperCase()
                                    : "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  {isUploading
                                    ? "Uploading..."
                                    : "Upload New Photo"}
                                </Button>

                                {userData?.headshot && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveHeadshot}
                                    disabled={isUploading}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Remove
                                  </Button>
                                )}
                              </div>

                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleHeadshotUpload}
                                accept="image/jpeg,image/png,image/gif"
                                className="hidden"
                              />

                              <div className="text-xs text-gray-500">
                                JPG, PNG or GIF. Max size 10MB.
                              </div>
                            </div>
                          </div>

                          {uploadError && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{uploadError}</AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={profileMutation.isPending || isUploading}
                          >
                            {profileMutation.isPending ? (
                              <>Saving Changes...</>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form
                      onSubmit={notificationForm.handleSubmit(
                        onNotificationSubmit
                      )}
                      className="space-y-6"
                    >
                      <FormField
                        control={notificationForm.control}
                        name="email_notifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via email.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="cfp_deadline_reminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                CFP Deadline Reminders
                              </FormLabel>
                              <FormDescription>
                                Receive a reminder 3 days before CFP deadlines.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="cfp_status_updates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                CFP Status Updates
                              </FormLabel>
                              <FormDescription>
                                Receive notifications when your CFP status
                                changes.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="new_cfp_digest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                New CFP Digest
                              </FormLabel>
                              <FormDescription>
                                Receive a weekly digest of new CFP
                                opportunities.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="event_reminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Event Reminders
                              </FormLabel>
                              <FormDescription>
                                Receive reminders for upcoming events you're
                                attending.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-base font-medium">
                            Change Password
                          </h4>
                          <p className="text-sm text-gray-500">
                            Update your password to enhance your account
                            security
                          </p>
                        </div>
                        <Button variant="outline">
                          <KeyRound className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-base font-medium">
                            Two-Factor Authentication
                          </h4>
                          <p className="text-sm text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Enable 2FA
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-base font-medium">
                            Connected Accounts
                          </h4>
                          <p className="text-sm text-gray-500">
                            Manage third-party accounts linked to your profile
                          </p>
                        </div>
                        <Button variant="outline">Manage</Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-base font-medium text-red-800">
                            Danger Zone
                          </h4>
                          <p className="text-sm text-red-600">
                            Permanently delete your account and all your data
                          </p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
