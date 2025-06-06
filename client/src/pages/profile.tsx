import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const { user, authenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch user profile data from server
  const { data: serverUserData, isLoading, error } = useQuery({
    queryKey: [`/api/users/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await apiRequest("GET", `/api/users/${user.id}`);
        if (res.ok) {
          return res.json();
        }
        return null;
      } catch (error) {
        // User doesn't exist in server, return null
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      jobTitle: "",
      role: "",
    },
  });

  // Load user data when available
  useEffect(() => {
    if (authenticated && user && !isLoading) {
      const profileData = serverUserData || {};
      form.reset({
        name: user.name || user.firstName || user.username || "",
        email: user.email || "",
        bio: profileData.bio || "",
        jobTitle: profileData.jobTitle || "",
        role: profileData.role || "",
      });
    }
  }, [user, authenticated, serverUserData, isLoading, form]);

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
      setIsEditing(false);
      // Refresh the profile data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
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
    onSuccess: (data) => {
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
      });
      setUploadingImage(false);
      
      // Invalidate and refetch profile data to show the new headshot
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      
      // Also invalidate assets query to show the new asset
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
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

  if (isLoading || !authenticated) {
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

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-medium mb-2">Profile not found</h2>
            <p className="text-muted-foreground">Please log in to view your profile information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create a profile object from Keycloak data and server data
  const profileData = serverUserData || {};
  const profile = {
    id: user.id,
    username: user.username,
    name: user.name || user.firstName || user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: profileData.bio || "",
    jobTitle: profileData.jobTitle || "",
    role: profileData.role || "",
    headshot: profileData.headshot || "",
    createdAt: profileData.createdAt || null,
  };

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
                    {profile.name ? getInitials(profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="headshot-upload" 
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
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
                <div className="text-sm text-muted-foreground">Uploading...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={updateMutation.isPending}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                              <SelectValue placeholder="Select a role" />
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

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm">{profile.name || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{profile.email || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm">{profile.username || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                  <p className="text-sm">{profile.jobTitle || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-sm">{profile.role || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="text-sm whitespace-pre-wrap">{profile.bio || "No bio provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}