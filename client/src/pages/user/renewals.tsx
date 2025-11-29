import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  XCircle,
  CheckCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { CertificationForm } from "@/components/certification-form";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCertificationsByUser, updateCertification } from "@/lib/localData";
import type { Certification } from "@shared/schema";

export default function UserRenewals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCert, setEditingCert] = useState<Certification | null>(null);

  const { data: certifications = [], isLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications", "user", user?.id],
    queryFn: async () => getCertificationsByUser(user?.id),
    enabled: !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", "user", user?.id] });
      setEditingCert(null);
      toast({
        title: "Certification updated",
        description: "Your certification has been renewed successfully.",
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

  const categorizedCerts = {
    expired: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days < 0;
    }),
    critical: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days >= 0 && days <= 30;
    }),
    warning: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 30 && days <= 60;
    }),
    upcoming: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 60 && days <= 90;
    }),
  };

  const totalNeedingAttention =
    categorizedCerts.expired.length +
    categorizedCerts.critical.length +
    categorizedCerts.warning.length +
    categorizedCerts.upcoming.length;

  const getTimeProgress = (cert: Certification) => {
    const issueDate = parseISO(cert.issueDate);
    const expDate = parseISO(cert.expirationDate);
    const now = new Date();
    const totalDays = differenceInDays(expDate, issueDate);
    const elapsedDays = differenceInDays(now, issueDate);
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const renderSection = (
    title: string,
    certs: Certification[],
    icon: React.ElementType,
    color: string,
    bgColor: string
  ) => {
    if (certs.length === 0) return null;

    const Icon = icon;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge variant="secondary">{certs.length}</Badge>
        </div>
        <div className="space-y-3">
          {certs.map((cert) => {
            const days = differenceInDays(parseISO(cert.expirationDate), new Date());
            const progress = getTimeProgress(cert);

            return (
              <Card key={cert.id} data-testid={`card-renewal-${cert.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid="text-cert-name">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuingOrganization}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Expires {format(parseISO(cert.expirationDate), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="mt-3 max-w-xs">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Validity period</span>
                            <span className={color}>
                              {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.certificateUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setEditingCert(cert)}
                        data-testid="button-update-renewal"
                      >
                        Update Renewal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Upcoming Renewals</h1>
        <p className="text-muted-foreground mt-1">
          Monitor certification deadlines and plan your renewals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-expired-count">
                  {categorizedCerts.expired.length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Within 30 Days</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-30-days-count">
                  {categorizedCerts.critical.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-60-days-count">
                  {categorizedCerts.warning.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-2xl font-bold" data-testid="text-90-days-count">
                  {categorizedCerts.upcoming.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {totalNeedingAttention === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All certifications are up to date!"
          description="None of your certifications are expiring in the next 90 days. Great job keeping your credentials current!"
        />
      ) : (
        <div className="space-y-8">
          {renderSection(
            "Expired - Immediate Action Required",
            categorizedCerts.expired,
            XCircle,
            "text-destructive",
            "bg-destructive/10"
          )}
          {renderSection(
            "Critical - Expiring Within 30 Days",
            categorizedCerts.critical,
            AlertTriangle,
            "text-destructive",
            "bg-destructive/10"
          )}
          {renderSection(
            "Warning - Expiring Within 60 Days",
            categorizedCerts.warning,
            Clock,
            "text-yellow-600 dark:text-yellow-500",
            "bg-yellow-500/10"
          )}
          {renderSection(
            "Upcoming - Expiring Within 90 Days",
            categorizedCerts.upcoming,
            Clock,
            "text-muted-foreground",
            "bg-muted"
          )}
        </div>
      )}

      <CertificationForm
        open={!!editingCert}
        onOpenChange={(open) => !open && setEditingCert(null)}
        onSubmit={(data) => updateMutation.mutate(data)}
        certification={editingCert}
        isLoading={updateMutation.isPending}
        currentUserId={user?.id}
      />
    </div>
  );
}
