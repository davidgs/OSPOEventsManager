import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Plus, Search, Calendar, FileText, AlertTriangle,
  Check, X, Clock, ArrowUpDown 
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
import { insertCfpSubmissionSchema, cfpStatuses } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const formSchema = insertCfpSubmissionSchema.extend({
  submissionDate: z.date().optional(),
});

const CfpSubmissionsPage: FC = () => {
  const [searchParams] = useLocation();
  const { toast } = useToast();
  
  // Extract eventId from search params if present
  const params = new URLSearchParams(searchParams);
  const eventIdParam = params.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam) : undefined;
  
  // State for filters and search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // State for modal/dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  // Fetch CFP submissions
  const { 
    data: cfpSubmissions = [], 
    isLoading: isLoadingSubmissions,
    isError: isErrorSubmissions,
  } = useQuery({
    queryKey: ['/api/cfp-submissions', eventId],
    queryFn: async ({ queryKey }) => {
      const url = eventId 
        ? `/api/cfp-submissions?eventId=${eventId}` 
        : '/api/cfp-submissions';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch CFP submissions');
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
  
  // Add submission mutation
  const { mutate: addSubmission, isPending: isAddingSubmission } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const formattedData = {
        ...data,
        submissionDate: data.submissionDate ? format(data.submissionDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      };
      return await apiRequest('POST', '/api/cfp-submissions', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfp-submissions'] });
      setIsAddModalOpen(false);
      toast({
        title: "CFP Submission Added",
        description: "The CFP submission has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add CFP submission",
        variant: "destructive",
      });
    },
  });
  
  // Delete submission mutation
  const { mutate: deleteSubmission, isPending: isDeletingSubmission } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/cfp-submissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfp-submissions'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "CFP Submission Deleted",
        description: "The CFP submission has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete CFP submission",
        variant: "destructive",
      });
    },
  });
  
  // Update submission status mutation
  const { mutate: updateSubmissionStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return await apiRequest('PUT', `/api/cfp-submissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfp-submissions'] });
      toast({
        title: "Status Updated",
        description: "The CFP submission status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });
  
  // Form for adding a new submission
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId: eventId || undefined,
      title: "",
      abstract: "",
      submitterName: "Alex Johnson", // Default to current user
      status: "draft",
      notes: "",
    },
  });
  
  // Handle adding a new submission
  const handleAddSubmission = (data: z.infer<typeof formSchema>) => {
    addSubmission(data);
  };
  
  // Handle deleting a submission
  const handleDeleteSubmission = () => {
    if (selectedSubmission) {
      deleteSubmission(selectedSubmission.id);
    }
  };
  
  // Handle updating submission status
  const handleStatusChange = (id: number, newStatus: string) => {
    updateSubmissionStatus({ id, status: newStatus });
  };
  
  // Handle opening delete dialog
  const openDeleteDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setIsDeleteDialogOpen(true);
  };
  
  // Sort function for submissions
  const sortSubmissions = (a: any, b: any) => {
    let comparison = 0;
    
    switch (sortField) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "submitterName":
        comparison = a.submitterName.localeCompare(b.submitterName);
        break;
      case "submissionDate":
        const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0;
        const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
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
  
  // Filter and sort submissions
  const filteredSubmissions = cfpSubmissions
    .filter((submission: any) => {
      let matches = true;
      
      // Filter by status
      if (statusFilter !== "all" && submission.status !== statusFilter) {
        matches = false;
      }
      
      // Filter by search term
      if (searchTerm && !submission.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !submission.submitterName.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches = false;
      }
      
      return matches;
    })
    .sort(sortSubmissions);
  
  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      case "draft":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" /> Submitted
          </span>
        );
      case "withdrawn":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };
  
  // Loading state
  const isLoading = isLoadingSubmissions || isLoadingEvents;
  
  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between pb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">CFP Submissions</h2>
            {eventId && !isLoadingEvents && (
              <p className="mt-1 text-sm text-gray-500">
                Showing submissions for event: <span className="font-medium">{getEventName(eventId)}</span>
              </p>
            )}
          </div>
          <div className="flex mt-4 md:mt-0 md:ml-4">
            <Button onClick={() => setIsAddModalOpen(true)} className="text-sm">
              <Plus className="mr-2 h-4 w-4" />
              New Submission
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-3">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {cfpStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search submissions..."
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
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          </div>
        ) : isErrorSubmissions ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-500">Failed to load CFP submissions. Please try again.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cfp-submissions'] })} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="text-center p-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <CardTitle className="mt-4 text-xl">No CFP Submissions Found</CardTitle>
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters to find what you're looking for." 
                  : "Get started by adding your first CFP submission."}
              </p>
              {!(searchTerm || statusFilter !== "all") && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Submission
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
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {sortField === "title" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    {!eventId && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                    )}
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("submitterName")}
                    >
                      <div className="flex items-center">
                        Submitter
                        {sortField === "submitterName" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => handleSort("submissionDate")}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === "submissionDate" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === "status" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission: any) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.title}</div>
                      </td>
                      {!eventId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{getEventName(submission.eventId)}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{submission.submitterName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-500">
                          {submission.submissionDate ? format(new Date(submission.submissionDate), "MMM d, yyyy") : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          value={submission.status}
                          onValueChange={(value) => handleStatusChange(submission.id, value)}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue>
                              {getStatusBadge(submission.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {cfpStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusBadge(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => openDeleteDialog(submission)}
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
      
      {/* Add Submission Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add CFP Submission</DialogTitle>
            <DialogDescription>
              Enter the details of the CFP submission you want to add.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubmission)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Event Selection (if not pre-selected) */}
                {!eventId && (
                  <FormField
                    control={form.control}
                    name="eventId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
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
                
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter talk title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Abstract */}
                <FormField
                  control={form.control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Abstract <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter talk abstract"
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Submitter Name */}
                <FormField
                  control={form.control}
                  name="submitterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitter Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter submitter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cfpStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Any additional notes about this submission"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Add any important notes about this submission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingSubmission}>
                  {isAddingSubmission ? "Saving..." : "Save Submission"}
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
            <AlertDialogTitle>Are you sure you want to delete this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the CFP submission "{selectedSubmission?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSubmission}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSubmission();
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingSubmission}
            >
              {isDeletingSubmission ? "Deleting..." : "Delete Submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CfpSubmissionsPage;
