import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO, format } from "date-fns";
import { useState } from "react";
import { Link } from "wouter";
import {
  Award,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/stats-card";
import { CertificationCard } from "@/components/certification-card";
import { CertificationForm } from "@/components/certification-form";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCertificationsByUser, createCertification } from "@/lib/localData";
import type { Certification } from "@shared/schema";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const { data: certifications = [], isLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications", "user", user?.id],
    queryFn: async () => getCertificationsByUser(user?.id),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return createCertification({
        ...data,
        userId: user?.id,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
      });
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

  const stats = {
    total: certifications.length,
    active: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 90;
    }).length,
    expiringSoon: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 0 && days <= 90;
    }).length,
    expired: certifications.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days < 0;
    }).length,
  };

  const complianceRate = stats.total > 0
    ? Math.round(((stats.active + stats.expiringSoon) / stats.total) * 100)
    : 100;

  const upcomingRenewals = certifications
    .filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 0 && days <= 90;
    })
    .sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime())
    .slice(0, 3);

  const recentCerts = [...certifications]
    .sort((a, b) => parseISO(b.issueDate).getTime() - parseISO(a.issueDate).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-welcome">
            Welcome, {user?.fullName?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your professional certifications
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} data-testid="button-add-certification">
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Certifications"
          value={stats.total}
          icon={Award}
          variant="default"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          description="Within 90 days"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Expired"
          value={stats.expired}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${complianceRate * 3.52} 352`}
                    className={
                      complianceRate >= 80
                        ? "text-green-500"
                        : complianceRate >= 50
                        ? "text-yellow-500"
                        : "text-destructive"
                    }
                  />
                </svg>
                <span className="absolute text-3xl font-bold" data-testid="text-compliance-rate">
                  {complianceRate}%
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                {complianceRate >= 80
                  ? "Great job! Your certifications are up to date."
                  : complianceRate >= 50
                  ? "Some certifications need attention."
                  : "Action required! Multiple certifications need renewal."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg">Upcoming Renewals</CardTitle>
            <Link href="/dashboard/renewals">
              <Button variant="ghost" size="sm" data-testid="button-view-renewals">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No certifications expiring in the next 90 days
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRenewals.map((cert) => {
                  const days = differenceInDays(parseISO(cert.expirationDate), new Date());
                  const urgency = days <= 30 ? "destructive" : days <= 60 ? "secondary" : "secondary";
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`item-renewal-${cert.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                          days <= 30 ? "bg-destructive/10" : "bg-yellow-500/10"
                        }`}>
                          {days <= 30 ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {format(parseISO(cert.expirationDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={urgency as any}>
                        {days} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="text-lg">Recent Certifications</CardTitle>
          <Link href="/dashboard/certifications">
            <Button variant="ghost" size="sm" data-testid="button-view-all-certs">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentCerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't added any certifications yet
              </p>
              <Button onClick={() => setFormOpen(true)} data-testid="button-add-first-cert">
                Add Your First Certification
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentCerts.map((cert) => (
                <CertificationCard
                  key={cert.id}
                  certification={cert}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CertificationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        currentUserId={user?.id}
      />
    </div>
  );
}
