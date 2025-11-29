import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
import { Search, Users as UsersIcon, Award, AlertTriangle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import type { Certification, User } from "@shared/schema";

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/certifications"],
  });

  const isLoading = usersLoading || certsLoading;

  const regularUsers = users.filter((u) => u.role === "user");

  const filteredUsers = regularUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getUserStats = (userId: string) => {
    const userCerts = certifications.filter((c) => c.userId === userId);
    const active = userCerts.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 90;
    }).length;
    const expiring = userCerts.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days > 0 && days <= 90;
    }).length;
    const expired = userCerts.filter((c) => {
      const days = differenceInDays(parseISO(c.expirationDate), new Date());
      return days < 0;
    }).length;
    return { total: userCerts.length, active, expiring, expired };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 max-w-sm" />
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
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage registered users and their certifications
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-users"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={search ? "No users found" : "No users yet"}
          description={
            search
              ? "Try adjusting your search criteria"
              : "Users will appear here once they register"
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const stats = getUserStats(user.id);
            return (
              <Card key={user.id} className="hover-elevate" data-testid={`card-user-${user.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-base font-medium">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate" data-testid="text-user-name">
                        {user.fullName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate" data-testid="text-user-email">{user.email}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Award className="h-3 w-3" />
                        Total
                      </div>
                      <span className="font-semibold" data-testid="text-total-certs">{stats.total}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-green-500/10">
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 mb-1">
                        Active
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-500" data-testid="text-active-certs">
                        {stats.active}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-destructive/10">
                      <div className="flex items-center gap-1 text-xs text-destructive mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expiring
                      </div>
                      <span className="font-semibold text-destructive" data-testid="text-expiring-certs">
                        {stats.expiring + stats.expired}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
