import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Mail,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { CertificationForm } from "@/components/certification-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAllCertifications, updateCertification } from "@/lib/localData";
import { getAllUsers } from "@/lib/localAuth";
import type { Certification, User } from "@shared/schema";

type TimeFilter = "30" | "60" | "90" | "expired" | "all";

export default function AdminExpiring() {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [editingCert, setEditingCert] = useState<Certification | null>(null);

  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications"],
    queryFn: async () => getAllCertifications(),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => getAllUsers(),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return updateCertification(editingCert!.id, {
        ...data,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setEditingCert(null);
      toast({
        title: "Certification renewed",
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

  const getExpiringCerts = () => {
    return certifications.filter((cert) => {
      const days = differenceInDays(parseISO(cert.expirationDate), new Date());

      switch (timeFilter) {
        case "30":
          return days > 0 && days <= 30;
        case "60":
          return days > 0 && days <= 60;
        case "90":
          return days > 0 && days <= 90;
        case "expired":
          return days < 0;
        default:
          return days <= 90;
      }
    }).sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime());
  };

  const expiringCerts = getExpiringCerts();

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.fullName || "Unknown";
  };

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || "";
  };

  const getStatusInfo = (days: number) => {
    if (days < 0) {
      return {
        icon: XCircle,
        label: `Expired ${Math.abs(days)} days ago`,
        variant: "destructive" as const,
        color: "text-destructive",
        bg: "bg-destructive/10",
      };
    } else if (days <= 30) {
      return {
        icon: AlertTriangle,
        label: `${days} days remaining`,
        variant: "destructive" as const,
        color: "text-destructive",
        bg: "bg-destructive/10",
      };
    } else if (days <= 60) {
      return {
        icon: Clock,
        label: `${days} days remaining`,
        variant: "secondary" as const,
        color: "text-yellow-600 dark:text-yellow-500",
        bg: "bg-yellow-500/10",
      };
    } else {
      return {
        icon: Clock,
        label: `${days} days remaining`,
        variant: "secondary" as const,
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
    }
  };

  const stats = {
    within30: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 0 && days <= 30;
    }).length,
    within60: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 30 && days <= 60;
    }).length,
    within90: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 60 && days <= 90;
    }).length,
    expired: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days < 0;
    }).length,
  };

  if (certsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Expiring Certifications</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage certifications that need renewal
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className={timeFilter === "30" ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setTimeFilter("30")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Within 30 Days</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-30-days">{stats.within30}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={timeFilter === "60" ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setTimeFilter("60")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-60-days">
                  {stats.within60}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={timeFilter === "90" ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setTimeFilter("90")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-2xl font-bold" data-testid="text-90-days">{stats.within90}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={timeFilter === "expired" ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setTimeFilter("expired")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-expired">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[180px]" data-testid="select-time-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expiring/Expired</SelectItem>
            <SelectItem value="30">Within 30 Days</SelectItem>
            <SelectItem value="60">Within 60 Days</SelectItem>
            <SelectItem value="90">Within 90 Days</SelectItem>
            <SelectItem value="expired">Expired Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {expiringCerts.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No certifications to show"
          description={
            timeFilter === "all"
              ? "Great news! No certifications are expiring soon or have expired."
              : "No certifications match the selected filter."
          }
        />
      ) : (
        <div className="space-y-3">
          {expiringCerts.map((cert) => {
            const days = differenceInDays(parseISO(cert.expirationDate), new Date());
            const status = getStatusInfo(days);
            const StatusIcon = status.icon;

            return (
              <Card key={cert.id} data-testid={`card-expiring-${cert.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${status.bg}`}>
                        <StatusIcon className={`h-6 w-6 ${status.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold" data-testid="text-cert-name">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuingOrganization}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground" data-testid="text-cert-user">
                            {getUserName(cert.userId)}
                          </span>
                          <span className={status.color} data-testid="text-days-remaining">
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge variant={status.variant} data-testid="badge-expiration-date">
                        {format(parseISO(cert.expirationDate), "MMM d, yyyy")}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCert(cert)}
                        data-testid="button-renew"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renew
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CertificationForm
        open={!!editingCert}
        onOpenChange={(open) => !open && setEditingCert(null)}
        onSubmit={(data) => updateMutation.mutate(data)}
        certification={editingCert}
        isLoading={updateMutation.isPending}
        isAdmin={true}
        users={users.filter((u) => u.role === "user")}
      />
    </div>
  );
}
