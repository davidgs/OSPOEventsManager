import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { CheckCircle, ClipboardList, Clock, FileClock, PlusCircle, AlertCircle, XCircle, CircleSlash } from "lucide-react";
import { approvalStatuses, approvalItemTypes, eventPriorities } from "@/lib/constants";

export default function ApprovalWorkflowsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
    itemType: "",
    itemId: "",
    priority: "medium",
    dueDate: "",
    requesterId: 1, // TODO: Get from current user
    reviewerIds: [] as number[],
    stakeholderIds: [] as number[],
    metadata: {}
  });

  // Fetch all workflows or filtered by status
  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ['/api/approval-workflows', activeTab !== 'all' ? { status: activeTab } : {}],
  });

  // Fetch users for reviewers selection
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch stakeholders for stakeholders selection
  const { data: stakeholders } = useQuery({
    queryKey: ['/api/stakeholders'],
  });

  // Create a new workflow
  const createWorkflowMutation = useMutation({
    mutationFn: (workflow: any) => apiRequest('/api/approval-workflows', {
      method: 'POST',
      data: workflow
    }),
    onSuccess: () => {
      toast({
        title: "Workflow created",
        description: "The approval workflow has been successfully created."
      });
      setIsCreateDialogOpen(false);
      setNewWorkflow({
        title: "",
        description: "",
        itemType: "",
        itemId: "",
        priority: "medium",
        dueDate: "",
        requesterId: 1,
        reviewerIds: [],
        stakeholderIds: [],
        metadata: {}
      });
      queryClient.invalidateQueries({ queryKey: ['/api/approval-workflows'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create workflow: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewWorkflow(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setNewWorkflow(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflow.title || !newWorkflow.itemType || !newWorkflow.itemId || newWorkflow.reviewerIds.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select at least one reviewer.",
        variant: "destructive"
      });
      return;
    }

    // Convert itemId to number
    const workflowData = {
      ...newWorkflow,
      itemId: parseInt(newWorkflow.itemId),
    };

    createWorkflowMutation.mutate(workflowData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "approved":
        return <Badge variant="success" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case "changes_requested":
        return <Badge variant="warning" className="flex items-center gap-1 bg-yellow-500"><AlertCircle className="h-3 w-3" /> Changes Requested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="capitalize">{priority}</Badge>;
      case "medium":
        return <Badge variant="outline" className="capitalize">{priority}</Badge>;
      case "low":
        return <Badge variant="secondary" className="capitalize">{priority}</Badge>;
      default:
        return <Badge className="capitalize">{priority}</Badge>;
    }
  };

  const renderWorkflowCards = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, i) => (
        <SkeletonCard key={i} />
      ));
    }

    if (error) {
      return (
        <div className="col-span-full text-center p-8">
          <p className="text-red-500">Error loading workflows: {(error as Error).message}</p>
        </div>
      );
    }

    if (!workflows || workflows.length === 0) {
      return (
        <div className="col-span-full text-center p-8">
          <p className="text-muted-foreground">No approval workflows found.</p>
        </div>
      );
    }

    return workflows.map((workflow: any) => (
      <Card key={workflow.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-xl">{workflow.title}</CardTitle>
            {getStatusBadge(workflow.status)}
          </div>
          <div className="flex justify-between items-center">
            <CardDescription className="flex items-center gap-1 capitalize">
              {workflow.itemType.replace('_', ' ')} #{workflow.itemId}
            </CardDescription>
            <div>{getPriorityBadge(workflow.priority)}</div>
          </div>
        </CardHeader>
        <CardContent>
          {workflow.description && (
            <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>
          )}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <FileClock className="h-4 w-4 text-muted-foreground" />
              <span>
                {workflow.dueDate 
                  ? new Date(workflow.dueDate).toLocaleDateString() 
                  : 'No due date'}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/approval-workflows/${workflow.id}`}>View Details</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track approval workflows for events, CFP submissions, and sponsorships.
          </p>
        </div>
        <div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Create Workflow</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Approval Workflow</DialogTitle>
                <DialogDescription>
                  Create a new approval workflow to track and manage approvals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Workflow title"
                    value={newWorkflow.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Provide a brief description of this workflow"
                    value={newWorkflow.description || ""}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemType">Item Type <span className="text-red-500">*</span></Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("itemType", value)} 
                      value={newWorkflow.itemType}
                    >
                      <SelectTrigger id="itemType">
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvalItemTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemId">Item ID <span className="text-red-500">*</span></Label>
                    <Input 
                      id="itemId" 
                      name="itemId" 
                      type="number"
                      placeholder="ID of the related item"
                      value={newWorkflow.itemId}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("priority", value)} 
                      value={newWorkflow.priority}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventPriorities.map(priority => (
                          <SelectItem key={priority} value={priority} className="capitalize">
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input 
                      id="dueDate" 
                      name="dueDate" 
                      type="date" 
                      value={newWorkflow.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewerIds">Reviewers <span className="text-red-500">*</span></Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("reviewerIds", [parseInt(value)])} 
                  >
                    <SelectTrigger id="reviewerIds">
                      <SelectValue placeholder="Select reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users && users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Multiple reviewer selection will be available in a future update.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createWorkflowMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateWorkflow}
                  disabled={createWorkflowMutation.isPending}
                >
                  {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>All Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </TabsTrigger>
          <TabsTrigger value="changes_requested" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Changes Requested</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderWorkflowCards()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}