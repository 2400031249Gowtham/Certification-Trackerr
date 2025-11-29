import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  Award,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/stats-card";
import { CertificationCard } from "@/components/certification-card";
import { Link } from "wouter";
import type { Certification, User } from "@shared/schema";

export default function AdminDashboard() {
  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = certsLoading || usersLoading;

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
    users: users.filter((u) => u.role === "user").length,
  };

  const expiringCertifications = certifications
    .filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 0 && days <= 30;
    })
    .sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime())
    .slice(0, 5);

  const recentCertifications = [...certifications]
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
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all certifications and users
          </p>
        </div>
        <Link href="/admin/certifications">
          <Button data-testid="button-add-certification">
            <Plus className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        </Link>
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
          icon={TrendingUp}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              Expiring Within 30 Days
            </CardTitle>
            <Badge variant="destructive" data-testid="badge-expiring-count">
              {expiringCertifications.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {expiringCertifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No certifications expiring soon
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringCertifications.map((cert) => {
                  const days = differenceInDays(parseISO(cert.expirationDate), new Date());
                  const user = users.find((u) => u.id === cert.userId);
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`item-expiring-${cert.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user?.fullName || "Unknown User"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="shrink-0">
                        {days} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              Recently Added
            </CardTitle>
            <Link href="/admin/certifications">
              <Button variant="ghost" size="sm" data-testid="button-view-all">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCertifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Award className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No certifications yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCertifications.map((cert) => {
                  const user = users.find((u) => u.id === cert.userId);
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`item-recent-${cert.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user?.fullName || "Unknown User"} · {format(parseISO(cert.issueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
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
          <CardTitle className="text-lg font-semibold">
            Users Overview
          </CardTitle>
          <Badge variant="secondary" data-testid="badge-users-count">
            {stats.users} users
          </Badge>
        </CardHeader>
        <CardContent>
          {users.filter((u) => u.role === "user").length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No users registered yet
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {users
                .filter((u) => u.role === "user")
                .slice(0, 6)
                .map((user) => {
                  const userCerts = certifications.filter((c) => c.userId === user.id);
                  const expiringCount = userCerts.filter((c) => {
                    const days = differenceInDays(parseISO(c.expirationDate), new Date());
                    return days > 0 && days <= 90;
                  }).length;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      data-testid={`item-user-${user.id}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {userCerts.length} certification{userCerts.length !== 1 ? "s" : ""}
                          {expiringCount > 0 && (
                            <span className="text-destructive ml-1">
                              ({expiringCount} expiring)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
