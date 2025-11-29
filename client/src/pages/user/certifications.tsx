import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { Plus, Search, Filter, Award, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CertificationCard } from "@/components/certification-card";
import { CertificationForm } from "@/components/certification-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Certification } from "@shared/schema";

type StatusFilter = "all" | "active" | "expiring" | "expired";
type ViewMode = "grid" | "list";

export default function UserCertifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certification | null>(null);

  const { data: certifications = [], isLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications", "user", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/certifications?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/certifications", {
        ...data,
        userId: user?.id,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", "user", user?.id] });
      setFormOpen(false);
      toast({
        title: "Certification added",
        description: "Your certification has been recorded successfully.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", "user", user?.id] });
      setEditingCert(null);
      toast({
        title: "Certification updated",
        description: "Your certification has been updated successfully.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", "user", user?.id] });
      setDeletingCert(null);
      toast({
        title: "Certification deleted",
        description: "Your certification has been removed.",
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

  if (isLoading) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">My Certifications</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your professional certifications
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
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
              data-testid="button-grid-view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
              data-testid="button-list-view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredCertifications.length === 0 ? (
        <EmptyState
          icon={Award}
          title={search || statusFilter !== "all" ? "No results found" : "No certifications yet"}
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Add your first certification to start tracking"
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
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredCertifications.map((cert) => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              onEdit={setEditingCert}
              onDelete={setDeletingCert}
            />
          ))}
        </div>
      )}

      <CertificationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        currentUserId={user?.id}
      />

      <CertificationForm
        open={!!editingCert}
        onOpenChange={(open) => !open && setEditingCert(null)}
        onSubmit={(data) => updateMutation.mutate(data)}
        certification={editingCert}
        isLoading={updateMutation.isPending}
        currentUserId={user?.id}
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
