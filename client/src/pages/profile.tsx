import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { User } from "@shared/schema";
import { Edit2, Camera, Save, X } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const roleOptions = [
  "Community Manager",
  "Developer Relations",
  "Technical Writer",
  "Software Engineer",
  "Product Manager",
  "Marketing Manager",
  "Other"
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      bio: profile?.bio || "",
      jobTitle: profile?.jobTitle || "",
      role: profile?.role || "",
    },
  });

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        jobTitle: profile.jobTitle || "",
        role: profile.role || "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const headshotMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('headshot', file);
      const res = await apiRequest("POST", `/api/users/${user?.id}/headshot`, formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      setUploadingImage(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingImage(false);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      headshotMutation.mutate(file);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-medium mb-2">Profile not found</h2>
            <p className="text-muted-foreground">Unable to load your profile information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.headshot || ""} alt={profile.name || 'User'} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="headshot-upload" className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-3 w-3" />
                  <input
                    id="headshot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {uploadingImage && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and professional information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your job title" {...field} />
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
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
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
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself and your experience with open source..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Name</h4>
                      <p className="text-lg">{profile.name || "Not set"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Email</h4>
                      <p className="text-lg">{profile.email || "Not set"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Job Title</h4>
                      <p className="text-lg">{profile.jobTitle || "Not set"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Role</h4>
                      <p className="text-lg">{profile.role || "Not set"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Bio</h4>
                  <p className="text-base leading-relaxed">{profile.bio || "No bio provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and login information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">User ID</h4>
              <p className="text-lg font-mono">{profile.id}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Username</h4>
              <p className="text-lg">{profile.username || "Not set"}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Member Since</h4>
              <p className="text-lg">
                {profile.createdAt 
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "Unknown"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}