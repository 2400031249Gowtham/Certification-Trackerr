import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  Award,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CertificationForm } from "@/components/certification-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Certification, User } from "@shared/schema";

type StatusFilter = "all" | "active" | "expiring" | "expired";

export default function AdminCertifications() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certification | null>(null);

  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/certifications", {
        ...data,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setFormOpen(false);
      toast({
        title: "Certification added",
        description: "The certification has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add certification.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/certifications/${editingCert?.id}`, {
        ...data,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setEditingCert(null);
      toast({
        title: "Certification updated",
        description: "The certification has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update certification.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/certifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setDeletingCert(null);
      toast({
        title: "Certification deleted",
        description: "The certification has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete certification.",
        variant: "destructive",
      });
    },
  });

  const getStatusInfo = (cert: Certification) => {
    const days = differenceInDays(parseISO(cert.expirationDate), new Date());
    if (days < 0) {
      return { label: "Expired", variant: "destructive" as const };
    } else if (days <= 30) {
      return { label: `${days}d left`, variant: "destructive" as const };
    } else if (days <= 90) {
      return { label: `${days}d left`, variant: "secondary" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.issuingOrganization.toLowerCase().includes(search.toLowerCase()) ||
      (cert.credentialId?.toLowerCase().includes(search.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    const days = differenceInDays(parseISO(cert.expirationDate), new Date());
    switch (statusFilter) {
      case "active":
        return days > 90;
      case "expiring":
        return days > 0 && days <= 90;
      case "expired":
        return days < 0;
      default:
        return true;
    }
  });

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.fullName || "Unknown";
  };

  if (certsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">All Certifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage all user certifications
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} data-testid="button-add-certification">
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCertifications.length === 0 ? (
        <EmptyState
          icon={Award}
          title={search || statusFilter !== "all" ? "No results found" : "No certifications yet"}
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Add your first certification to get started"
          }
          action={
            !search && statusFilter === "all"
              ? {
                  label: "Add Certification",
                  onClick: () => setFormOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certification</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertifications.map((cert) => {
                const status = getStatusInfo(cert);
                return (
                  <TableRow key={cert.id} data-testid={`row-cert-${cert.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid="text-cert-name">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cert.issuingOrganization}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid="text-cert-user">{getUserName(cert.userId)}</TableCell>
                    <TableCell data-testid="text-cert-issue-date">
                      {format(parseISO(cert.issueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell data-testid="text-cert-expiration">
                      {format(parseISO(cert.expirationDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} data-testid="badge-cert-status">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="button-cert-actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCert(cert)} data-testid="button-edit">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingCert(cert)}
                            className="text-destructive focus:text-destructive"
                            data-testid="button-delete"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CertificationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        isAdmin={true}
        users={users.filter((u) => u.role === "user")}
      />

      <CertificationForm
        open={!!editingCert}
        onOpenChange={(open) => !open && setEditingCert(null)}
        onSubmit={(data) => updateMutation.mutate(data)}
        certification={editingCert}
        isLoading={updateMutation.isPending}
        isAdmin={true}
        users={users.filter((u) => u.role === "user")}
      />

      <DeleteDialog
        open={!!deletingCert}
        onOpenChange={(open) => !open && setDeletingCert(null)}
        onConfirm={() => deletingCert && deleteMutation.mutate(deletingCert.id)}
        title="Delete Certification"
        description={`Are you sure you want to delete "${deletingCert?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
