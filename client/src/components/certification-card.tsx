import { format, differenceInDays, parseISO } from "date-fns";
import {
  Award,
  Calendar,
  Building2,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Certification } from "@shared/schema";

interface CertificationCardProps {
  certification: Certification;
  onEdit?: (certification: Certification) => void;
  onDelete?: (certification: Certification) => void;
  onRenew?: (certification: Certification) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

export function CertificationCard({
  certification,
  onEdit,
  onDelete,
  onRenew,
  showActions = true,
  isAdmin = false,
}: CertificationCardProps) {
  const expirationDate = parseISO(certification.expirationDate);
  const daysUntilExpiration = differenceInDays(expirationDate, new Date());
  
  const getStatusInfo = () => {
    if (daysUntilExpiration < 0) {
      return {
        status: "expired",
        label: "Expired",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-destructive",
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        status: "critical",
        label: `${daysUntilExpiration} days left`,
        variant: "destructive" as const,
        icon: AlertTriangle,
        color: "text-destructive",
      };
    } else if (daysUntilExpiration <= 60) {
      return {
        status: "warning",
        label: `${daysUntilExpiration} days left`,
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-500",
      };
    } else if (daysUntilExpiration <= 90) {
      return {
        status: "soon",
        label: `${daysUntilExpiration} days left`,
        variant: "secondary" as const,
        icon: Clock,
        color: "text-muted-foreground",
      };
    } else {
      return {
        status: "active",
        label: "Active",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-500",
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="group hover-elevate transition-all duration-200" data-testid={`card-certification-${certification.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight truncate" data-testid="text-certification-name">
              {certification.name}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" data-testid="text-issuing-org">{certification.issuingOrganization}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="shrink-0" data-testid="badge-status">
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.label}
          </Badge>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-testid="button-cert-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(certification)} data-testid="button-edit-cert">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onRenew && statusInfo.status !== "active" && (
                  <DropdownMenuItem onClick={() => onRenew(certification)} data-testid="button-renew-cert">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Mark as Renewed
                  </DropdownMenuItem>
                )}
                {certification.certificateUrl && (
                  <DropdownMenuItem asChild>
                    <a href={certification.certificateUrl} target="_blank" rel="noopener noreferrer" data-testid="link-view-cert">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Certificate
                    </a>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(certification)}
                      className="text-destructive focus:text-destructive"
                      data-testid="button-delete-cert"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Issue Date</p>
            <p className="font-medium" data-testid="text-issue-date">
              {format(parseISO(certification.issueDate), "MMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Expiration Date</p>
            <p className={`font-medium ${statusInfo.color}`} data-testid="text-expiration-date">
              {format(expirationDate, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {certification.credentialId && (
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground mb-1">Credential ID</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded" data-testid="text-credential-id">
              {certification.credentialId}
            </p>
          </div>
        )}
      </CardContent>

      {certification.notes && (
        <CardFooter className="pt-0 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-notes">
            {certification.notes}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
