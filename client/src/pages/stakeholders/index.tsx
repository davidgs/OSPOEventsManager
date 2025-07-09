import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, UserCog, MailIcon, Building, Users2 } from "lucide-react";
import { stakeholderRoles } from "@/lib/constants";

const DEFAULT_TAB = "all";

export default function StakeholdersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    role: "",
    organization: "",
    department: "",
    notes: "",
  });

  // Fetch all stakeholders
  const {
    data: stakeholders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/stakeholders"],
    enabled: activeTab === "all",
  });

  // Fetch stakeholders by role
  const { data: filteredStakeholders } = useQuery({
    queryKey: [`/api/stakeholders/role/${activeTab}`],
    enabled: activeTab !== "all",
  });

  // Create a new stakeholder
  const createStakeholderMutation = useMutation({
    mutationFn: (stakeholder: any) =>
      apiRequest("/api/stakeholders", {
        method: "POST",
        data: stakeholder,
      }),
    onSuccess: () => {
      toast({
        title: "Stakeholder added",
        description: "The stakeholder has been successfully added.",
      });
      setIsAddDialogOpen(false);
      setNewStakeholder({
        name: "",
        email: "",
        role: "",
        organization: "",
        department: "",
        notes: "",
      });
      // Invalidate the stakeholder queries
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      if (activeTab !== "all") {
        queryClient.invalidateQueries({
          queryKey: [`/api/stakeholders/role/${activeTab}`],
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add stakeholder: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddStakeholder = () => {
    // Validate required fields
    if (
      !newStakeholder.name ||
      !newStakeholder.email ||
      !newStakeholder.role ||
      !newStakeholder.organization
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createStakeholderMutation.mutate(newStakeholder);
  };

  // Handle input changes for new stakeholder
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewStakeholder((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes for new stakeholder
  const handleSelectChange = (name: string, value: string) => {
    setNewStakeholder((prev) => ({ ...prev, [name]: value }));
  };

  // Determine which data to display based on the active tab
  const displayData = activeTab === "all" ? stakeholders : filteredStakeholders;

  const renderStakeholderCards = () => {
    if (isLoading) {
      return Array(6)
        .fill(0)
        .map((_, i) => <SkeletonCard key={i} />);
    }

    if (error) {
      return (
        <div className="col-span-full text-center p-8">
          <p className="text-red-500">
            Error loading stakeholders: {(error as Error).message}
          </p>
        </div>
      );
    }

    if (!displayData || displayData.length === 0) {
      return (
        <div className="col-span-full text-center p-8">
          <p className="text-muted-foreground">No stakeholders found.</p>
        </div>
      );
    }

    return displayData.map((stakeholder: any) => (
      <Card key={stakeholder.id} className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{stakeholder.name}</CardTitle>
            <Badge>{stakeholder.role}</Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <MailIcon className="h-4 w-4" /> {stakeholder.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{stakeholder.organization}</span>
            </div>
            {stakeholder.department && (
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span>{stakeholder.department}</span>
              </div>
            )}
          </div>
          {stakeholder.notes && (
            <div className="mt-4 text-sm text-muted-foreground border-t pt-2">
              {stakeholder.notes}
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Stakeholders</h1>
          <p className="text-muted-foreground mt-1">
            Manage organization stakeholders involved in event approval
            processes.
          </p>
        </div>
        <div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Add Stakeholder</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Stakeholder</DialogTitle>
                <DialogDescription>
                  Add a new stakeholder who will be involved in approval
                  workflows.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Full name"
                      value={newStakeholder.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={newStakeholder.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("role", value)
                      }
                      value={newStakeholder.role}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholderRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">
                      Organization <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="organization"
                      name="organization"
                      placeholder="Company or organization"
                      value={newStakeholder.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="Department or team (optional)"
                    value={newStakeholder.department || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Additional information (optional)"
                    value={newStakeholder.notes || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={createStakeholderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStakeholder}
                  disabled={createStakeholderMutation.isPending}
                >
                  {createStakeholderMutation.isPending
                    ? "Adding..."
                    : "Add Stakeholder"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span>All Stakeholders</span>
          </TabsTrigger>
          {stakeholderRoles.map((role) => (
            <TabsTrigger key={role} value={role} className="capitalize">
              {role}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderStakeholderCards()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
