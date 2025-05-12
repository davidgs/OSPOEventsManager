import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, XCircle, AlertCircle, Clock, ArrowLeft, 
  UserCog, MessageSquare, History, ClipboardCheck, MessageCircle
} from "lucide-react";
import { approvalStatuses } from "@/lib/constants";

export default function WorkflowDetailPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const workflowId = parseInt(id);
  const [activeTab, setActiveTab] = useState("details");
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch workflow with related data
  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['/api/approval-workflows', workflowId],
    enabled: !isNaN(workflowId)
  });

  // Add a new comment
  const createCommentMutation = useMutation({
    mutationFn: (data: { workflowId: number; userId: number; text: string }) => 
      apiRequest('/api/workflow-comments', {
        method: 'POST',
        data: {
          workflowId: data.workflowId,
          userId: data.userId,
          text: data.text
        }
      }),
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added to the workflow."
      });
      setIsCommentDialogOpen(false);
      setCommentText("");
      // Invalidate workflow data to refresh comments
      queryClient.invalidateQueries({ queryKey: ['/api/approval-workflows', workflowId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update workflow status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; userId: number }) => 
      apiRequest(`/api/approval-workflows/${workflowId}/status`, {
        method: 'PUT',
        data
      }),
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The workflow status has been updated successfully."
      });
      // Invalidate workflow data to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/approval-workflows', workflowId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive"
      });
      return;
    }

    createCommentMutation.mutate({
      workflowId,
      userId: 1, // TODO: Get from current user
      text: commentText
    });
  };

  const handleUpdateStatus = (status: string) => {
    updateStatusMutation.mutate({
      status,
      userId: 1 // TODO: Get from current user
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-4 w-4" /> Pending</Badge>;
      case "approved":
        return <Badge variant="success" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-4 w-4" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-4 w-4" /> Rejected</Badge>;
      case "changes_requested":
        return <Badge variant="warning" className="flex items-center gap-1 bg-yellow-500"><AlertCircle className="h-4 w-4" /> Changes Requested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setLocation("/approval-workflows")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setLocation("/approval-workflows")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              {error ? (error as Error).message : "Workflow not found"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setLocation("/approval-workflows")}>
              Return to Workflows
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setLocation("/approval-workflows")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflows
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{workflow.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {workflow.itemType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    {events && (
                      <span className="ml-1 font-medium">
                        for {events.find((event: any) => event.id === workflow.itemId)?.name || `Event #${workflow.itemId}`}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(workflow.status)}
                  <Badge variant="outline" className="capitalize">{workflow.priority} Priority</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workflow.description && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{workflow.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {formatDate(workflow.createdAt)}
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>{' '}
                  {formatDate(workflow.updatedAt)}
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>{' '}
                  {workflow.dueDate ? formatDate(workflow.dueDate) : 'No due date'}
                </div>
                <div>
                  <span className="text-muted-foreground">Requester:</span>{' '}
                  User #{workflow.requesterId}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Add Comment</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Comment</DialogTitle>
                    <DialogDescription>
                      Add a comment to the workflow. This will be visible to all stakeholders.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea 
                      placeholder="Enter your comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCommentDialogOpen(false)}
                      disabled={createCommentMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddComment}
                      disabled={createCommentMutation.isPending}
                    >
                      {createCommentMutation.isPending ? "Submitting..." : "Submit Comment"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex gap-2">
                {workflow.status !== "approved" && (
                  <Button 
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                )}
                
                {workflow.status !== "rejected" && (
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                )}
                
                {workflow.status !== "changes_requested" && (
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                    onClick={() => handleUpdateStatus("changes_requested")}
                    disabled={updateStatusMutation.isPending}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Request Changes</span>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span>Details</span>
              </TabsTrigger>
              <TabsTrigger value="reviewers" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>Reviewers</span>
                {workflow.reviewers && (
                  <Badge variant="secondary" className="ml-1">{workflow.reviewers.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Comments</span>
                {workflow.comments && (
                  <Badge variant="secondary" className="ml-1">{workflow.comments.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>History</span>
                {workflow.history && (
                  <Badge variant="secondary" className="ml-1">{workflow.history.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">
                        {workflow.description || "No description provided"}
                      </p>
                    </div>
                    {workflow.metadata && Object.keys(workflow.metadata).length > 0 && (
                      <div>
                        <h3 className="text-md font-semibold mb-2">Additional Metadata</h3>
                        <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
                          {JSON.stringify(workflow.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviewers">
              <Card>
                <CardHeader>
                  <CardTitle>Reviewers</CardTitle>
                  <CardDescription>
                    People responsible for reviewing and approving this workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(!workflow.reviewers || workflow.reviewers.length === 0) && (
                    <p className="text-muted-foreground">No reviewers assigned</p>
                  )}
                  
                  {workflow.reviewers && workflow.reviewers.length > 0 && (
                    <div className="space-y-4">
                      {workflow.reviewers.map((reviewer: any) => (
                        <div key={reviewer.id} className="flex items-start gap-4 p-4 border rounded-md">
                          <Avatar>
                            <AvatarFallback>{reviewer.reviewerId.toString().substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">Reviewer #{reviewer.reviewerId}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {reviewer.isRequired ? "Required Reviewer" : "Optional Reviewer"}
                                </p>
                              </div>
                              <div>
                                {getStatusBadge(reviewer.status)}
                              </div>
                            </div>
                            {reviewer.comments && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">{reviewer.comments}</p>
                              </div>
                            )}
                            {reviewer.reviewedAt && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Reviewed on {formatDate(reviewer.reviewedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>
                    Discussion and notes related to this workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(!workflow.comments || workflow.comments.length === 0) && (
                    <div className="text-center py-6">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">No comments yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsCommentDialogOpen(true)}
                      >
                        Add the first comment
                      </Button>
                    </div>
                  )}
                  
                  {workflow.comments && workflow.comments.length > 0 && (
                    <div className="space-y-4">
                      {workflow.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-4 p-4 border rounded-md">
                          <Avatar>
                            <AvatarFallback>{comment.userId.toString().substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">User #{comment.userId}</h3>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => setIsCommentDialogOpen(true)} 
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Add Comment</span>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow History</CardTitle>
                  <CardDescription>
                    Timeline of events and changes to this workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(!workflow.history || workflow.history.length === 0) && (
                    <p className="text-muted-foreground">No history available</p>
                  )}
                  
                  {workflow.history && workflow.history.length > 0 && (
                    <div className="relative border-l border-gray-200 pl-6 space-y-6 ml-2">
                      {workflow.history.map((item: any, index: number) => (
                        <div key={item.id} className="relative pb-4">
                          <span className="absolute -left-[27px] flex items-center justify-center w-6 h-6 bg-primary rounded-full ring-8 ring-white">
                            <History className="h-3.5 w-3.5 text-white" />
                          </span>
                          <div className="p-4 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-medium">{item.action}</h3>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              User #{item.userId} {item.details}
                            </p>
                            {(item.previousStatus || item.newStatus) && (
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                {item.previousStatus && (
                                  <div className="flex items-center gap-1">
                                    From: {getStatusBadge(item.previousStatus)}
                                  </div>
                                )}
                                {item.previousStatus && item.newStatus && (
                                  <span className="text-muted-foreground mx-1">→</span>
                                )}
                                {item.newStatus && (
                                  <div className="flex items-center gap-1">
                                    To: {getStatusBadge(item.newStatus)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}