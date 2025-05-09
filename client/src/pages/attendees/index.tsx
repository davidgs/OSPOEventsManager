import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Plus, Search, Users, AlertTriangle, 
  Mail, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendeeSchema } from "@shared/schema";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AttendeesPage: FC = () => {
  const [searchParams] = useLocation();
  const { toast } = useToast();
  
  // Extract eventId from search params if present
  const params = new URLSearchParams(searchParams);
  const eventIdParam = params.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam) : undefined;
  
  // State for filters and search
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // State for modal/dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  
  // Fetch attendees
  const { 
    data: attendees = [], 
    isLoading: isLoadingAttendees,
    isError: isErrorAttendees,
  } = useQuery({
    queryKey: ['/api/attendees', eventId],
    queryFn: async ({ queryKey }) => {
      const url = eventId 
        ? `/api/attendees?eventId=${eventId}` 
        : '/api/attendees';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch attendees');
      return await res.json();
    },
  });
  
  // Fetch events for dropdown
  const { 
    data: events = [], 
    isLoading: isLoadingEvents,
  } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Extract unique roles for filter
  const roles = Array.from(new Set(attendees.map((attendee: any) => attendee.role).filter(Boolean)));
  
  // Add attendee mutation
  const { mutate: addAttendee, isPending: isAddingAttendee } = useMutation({
    mutationFn: async (data: z.infer<typeof insertAttendeeSchema>) => {
      const res = await apiRequest('POST', '/api/attendees', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendees'] });
      setIsAddModalOpen(false);
      toast({
        title: "Attendee Added",
        description: "The attendee has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add attendee",
        variant: "destructive",
      });
    },
  });
  
  // Delete attendee mutation
  const { mutate: deleteAttendee, isPending: isDeletingAttendee } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/attendees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendees'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Attendee Deleted",
        description: "The attendee has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete attendee",
        variant: "destructive",
      });
    },
  });
  
  // Form for adding a new attendee
  const form = useForm<z.infer<typeof insertAttendeeSchema>>({
    resolver: zodResolver(insertAttendeeSchema),
    defaultValues: {
      eventId: eventId || undefined,
      name: "",
      email: "",
      role: "",
      notes: "",
    },
  });
  
  // Handle adding a new attendee
  const handleAddAttendee = (data: z.infer<typeof insertAttendeeSchema>) => {
    addAttendee(data);
  };
  
  // Handle deleting an attendee
  const handleDeleteAttendee = () => {
    if (selectedAttendee) {
      deleteAttendee(selectedAttendee.id);
    }
  };
  
  // Handle opening delete dialog
  const openDeleteDialog = (attendee: any) => {
    setSelectedAttendee(attendee);
    setIsDeleteDialogOpen(true);
  };
  
  // Sort function for attendees
  const sortAttendees = (a: any, b: any) => {
    let comparison = 0;
    
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "role":
        const roleA = a.role || "";
        const roleB = b.role || "";
        comparison = roleA.localeCompare(roleB);
        break;
      case "email":
        const emailA = a.email || "";
        const emailB = b.email || "";
        comparison = emailA.localeCompare(emailB);
        break;
      case "eventId":
        // First compare by event name
        const eventNameA = getEventName(a.eventId);
        const eventNameB = getEventName(b.eventId);
        comparison = eventNameA.localeCompare(eventNameB);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  };
  
  // Get event name by ID
  const getEventName = (eventId: number) => {
    const event = events.find((e: any) => e.id === eventId);
    return event ? event.name : "Unknown Event";
  };
  
  // Filter and sort attendees
  const filteredAttendees = attendees
    .filter((attendee: any) => {
      let matches = true;
      
      // Filter by role
      if (roleFilter !== "all" && attendee.role !== roleFilter) {
        matches = false;
      }
      
      // Filter by search term
      if (searchTerm && !attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !(attendee.email && attendee.email.toLowerCase().includes(searchTerm.toLowerCase()))) {
        matches = false;
      }
      
      return matches;
    })
    .sort(sortAttendees);
  
  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Loading state
  const isLoading = isLoadingAttendees || isLoadingEvents;
  
  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between pb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">Attendees</h2>
            {eventId && !isLoadingEvents && (
              <p className="mt-1 text-sm text-gray-500">
                Showing attendees for event: <span className="font-medium">{getEventName(eventId)}</span>
              </p>
            )}
          </div>
          <div className="flex mt-4 md:mt-0 md:ml-4">
            <Button onClick={() => setIsAddModalOpen(true)} className="text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Attendee
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-3">
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-[300px]"
              />
            </div>
          </div>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading attendees...</p>
            </div>
          </div>
        ) : isErrorAttendees ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-500">Failed to load attendees. Please try again.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/attendees'] })} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <Card>
            <CardContent className="text-center p-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <CardTitle className="mt-4 text-xl">No Attendees Found</CardTitle>
              <p className="mt-2 text-gray-500">
                {searchTerm || roleFilter !== "all" 
                  ? "Try adjusting your search or filters to find what you're looking for." 
                  : "Get started by adding your first attendee."}
              </p>
              {!(searchTerm || roleFilter !== "all") && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attendee
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === "name" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center">
                        Role
                        {sortField === "role" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    {!eventId && (
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("eventId")}
                      >
                        <div className="flex items-center">
                          Event
                          {sortField === "eventId" && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                    )}
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {sortField === "email" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendees.map((attendee: any) => (
                    <tr key={attendee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{attendee.role || "-"}</div>
                      </td>
                      {!eventId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{getEventName(attendee.eventId)}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {attendee.email ? (
                          <a 
                            href={`mailto:${attendee.email}`} 
                            className="flex items-center text-sm text-blue-600 hover:text-blue-900"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            {attendee.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {attendee.notes || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => openDeleteDialog(attendee)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Attendee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attendee</DialogTitle>
            <DialogDescription>
              Enter the details of the attendee you want to add.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAttendee)} className="space-y-4">
              {/* Event Selection (if not pre-selected) */}
              {!eventId && (
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event" />
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
              )}
              
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter attendee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Add email for contact purposes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Speaker, Engineer, Manager" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Specify the attendee's role
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
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this attendee"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Add any important notes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingAttendee}>
                  {isAddingAttendee ? "Saving..." : "Save Attendee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this attendee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedAttendee?.name} from the attendee list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAttendee}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAttendee();
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingAttendee}
            >
              {isDeletingAttendee ? "Deleting..." : "Delete Attendee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendeesPage;
