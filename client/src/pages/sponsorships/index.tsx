import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Plus, Search, DollarSign, AlertTriangle,
  ArrowUpDown, Mail
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
import { insertSponsorshipSchema } from "@shared/schema";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const SponsorshipsPage: FC = () => {
  const [searchParams] = useLocation();
  const { toast } = useToast();

  // Extract eventId from search params if present
  const params = new URLSearchParams(searchParams);
  const eventIdParam = params.get("eventId");
  const eventId = eventIdParam ? parseInt(eventIdParam) : undefined;

  // State for filters and search
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // State for modal/dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState<any>(null);

  // Fetch sponsorships
  const {
    data: sponsorships = [],
    isLoading: isLoadingSponsorships,
    isError: isErrorSponsorships,
  } = useQuery({
    queryKey: ['/api/sponsorships', eventId],
    queryFn: async ({ queryKey }) => {
      const url = eventId
        ? `/api/sponsorships?eventId=${eventId}`
        : '/api/sponsorships';
      const res = await apiRequest('GET', url);
      if (!res.ok) throw new Error('Failed to fetch sponsorships');
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

  // Extract unique tiers and statuses for filters
  const tiers = Array.from(new Set(sponsorships.map((sponsorship: any) => sponsorship.tier)));
  const statuses = Array.from(new Set(sponsorships.map((sponsorship: any) => sponsorship.status)));

  // Add sponsorship mutation
  const { mutate: addSponsorship, isPending: isAddingSponsorship } = useMutation({
    mutationFn: async (data: z.infer<typeof insertSponsorshipSchema>) => {
      return await apiRequest('POST', '/api/sponsorships', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorships'] });
      setIsAddModalOpen(false);
      toast({
        title: "Sponsorship Added",
        description: "The sponsorship has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sponsorship",
        variant: "destructive",
      });
    },
  });

  // Delete sponsorship mutation
  const { mutate: deleteSponsorship, isPending: isDeletingSponsorship } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/sponsorships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorships'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Sponsorship Deleted",
        description: "The sponsorship has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sponsorship",
        variant: "destructive",
      });
    },
  });

  // Form for adding a new sponsorship
  const form = useForm<z.infer<typeof insertSponsorshipSchema>>({
    resolver: zodResolver(insertSponsorshipSchema),
    defaultValues: {
      event_id: eventId || undefined,
      sponsor_name: "",
      tier: "",
      amount: "",
      status: "pending",
      contact_name: "",
      contact_email: "",
      notes: "",
    },
  });

  // Handle adding a new sponsorship
  const handleAddSponsorship = (data: z.infer<typeof insertSponsorshipSchema>) => {
    addSponsorship(data);
  };

  // Handle deleting a sponsorship
  const handleDeleteSponsorship = () => {
    if (selectedSponsorship) {
      deleteSponsorship(selectedSponsorship.id);
    }
  };

  // Handle opening delete dialog
  const openDeleteDialog = (sponsorship: any) => {
    setSelectedSponsorship(sponsorship);
    setIsDeleteDialogOpen(true);
  };

  // Sort function for sponsorships
  const sortSponsorships = (a: any, b: any) => {
    let comparison = 0;

    switch (sortField) {
      case "tier":
        comparison = a.tier.localeCompare(b.tier);
        break;
      case "amount":
        // Handle amount sorting (convert to number if possible)
        const amountA = a.amount ? a.amount.replace(/[^0-9.]/g, '') : "0";
        const amountB = b.amount ? b.amount.replace(/[^0-9.]/g, '') : "0";
        comparison = parseFloat(amountA) - parseFloat(amountB);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "contact_name":
        const nameA = a.contact_name || "";
        const nameB = b.contact_name || "";
        comparison = nameA.localeCompare(nameB);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  };

  // Get event name by ID
  const getEventName = (eventId: number) => {
    const event = (events as any[])?.find((e: any) => e.id === eventId);
    return event ? event.name : "Unknown Event";
  };

  // Filter and sort sponsorships
  const filteredSponsorships = sponsorships
    .filter((sponsorship: any) => {
      let matches = true;

      // Filter by tier
      if (levelFilter !== "all" && sponsorship.tier !== levelFilter) {
        matches = false;
      }

      // Filter by status
      if (statusFilter !== "all" && sponsorship.status !== statusFilter) {
        matches = false;
      }

      // Filter by search term
      if (searchTerm &&
          !sponsorship.tier.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(sponsorship.contact_name && sponsorship.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))) {
        matches = false;
      }

      return matches;
    })
    .sort(sortSponsorships);

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
    switch (status.toLowerCase()) {
      case "confirmed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Loading state
  const isLoading = isLoadingSponsorships || isLoadingEvents;

  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between pb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">Sponsorships</h2>
            {eventId && !isLoadingEvents && (
              <p className="mt-1 text-sm text-gray-500">
                Showing sponsorships for event: <span className="font-medium">{getEventName(eventId)}</span>
              </p>
            )}
          </div>
          <div className="flex mt-4 md:mt-0 md:ml-4">
            <Button onClick={() => setIsAddModalOpen(true)} className="text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Sponsorship
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {tiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
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
                placeholder="Search sponsorships..."
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
              <p className="mt-4 text-gray-600">Loading sponsorships...</p>
            </div>
          </div>
        ) : isErrorSponsorships ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-500">Failed to load sponsorships. Please try again.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/sponsorships'] })} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : filteredSponsorships.length === 0 ? (
          <Card>
            <CardContent className="text-center p-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <CardTitle className="mt-4 text-xl">No Sponsorships Found</CardTitle>
              <p className="mt-2 text-gray-500">
                {searchTerm || levelFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by adding your first sponsorship."}
              </p>
              {!(searchTerm || levelFilter !== "all" || statusFilter !== "all") && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sponsorship
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
                      onClick={() => handleSort("level")}
                    >
                      <div className="flex items-center">
                        Level
                        {sortField === "level" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === "amount" && (
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
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === "status" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => handleSort("contactName")}
                    >
                      <div className="flex items-center">
                        Contact
                        {sortField === "contactName" && (
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
                  {filteredSponsorships.map((sponsorship: any) => (
                    <tr key={sponsorship.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sponsorship.level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{sponsorship.amount || "-"}</div>
                      </td>
                      {!eventId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{getEventName(sponsorship.eventId)}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sponsorship.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {sponsorship.contactName ? (
                          <div className="text-sm text-gray-900">
                            {sponsorship.contactName}
                            {sponsorship.contactEmail && (
                              <a
                                href={`mailto:${sponsorship.contactEmail}`}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-900 mt-1"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                {sponsorship.contactEmail}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => openDeleteDialog(sponsorship)}
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

      {/* Add Sponsorship Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Sponsorship</DialogTitle>
            <DialogDescription>
              Enter the details of the sponsorship you want to add.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSponsorship)} className="space-y-4">
              {/* Event Selection (if not pre-selected) */}
              {!eventId && (
                <FormField
                  control={form.control}
                  name="event_id"
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

              {/* Sponsor Name */}
              <FormField
                control={form.control}
                name="sponsor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Microsoft, Google, IBM" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tier */}
              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsorship Tier <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Gold, Silver, Platinum" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. $5,000" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Optional: Sponsorship amount
                    </FormDescription>
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Name */}
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Optional: Name of contact person
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Email */}
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Contact email address" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Optional: Email of contact person
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
                        placeholder="Any additional notes about this sponsorship"
                        {...field}
                        value={field.value || ""}
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
                <Button type="submit" disabled={isAddingSponsorship}>
                  {isAddingSponsorship ? "Saving..." : "Save Sponsorship"}
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
            <AlertDialogTitle>Are you sure you want to delete this sponsorship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {selectedSponsorship?.level} sponsorship from this event. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSponsorship}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSponsorship();
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingSponsorship}
            >
              {isDeletingSponsorship ? "Deleting..." : "Delete Sponsorship"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SponsorshipsPage;
