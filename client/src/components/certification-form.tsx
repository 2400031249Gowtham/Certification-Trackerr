import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Certification, User } from "@shared/schema";

const certificationFormSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.date({ required_error: "Issue date is required" }),
  expirationDate: z.date({ required_error: "Expiration date is required" }),
  credentialId: z.string().optional(),
  certificateUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  userId: z.string().optional(),
});

type CertificationFormValues = z.infer<typeof certificationFormSchema>;

interface CertificationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationFormValues) => void;
  certification?: Certification | null;
  isLoading?: boolean;
  isAdmin?: boolean;
  users?: User[];
  currentUserId?: string;
}

export function CertificationForm({
  open,
  onOpenChange,
  onSubmit,
  certification,
  isLoading = false,
  isAdmin = false,
  users = [],
  currentUserId,
}: CertificationFormProps) {
  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      name: "",
      issuingOrganization: "",
      issueDate: undefined,
      expirationDate: undefined,
      credentialId: "",
      certificateUrl: "",
      notes: "",
      userId: currentUserId || "",
    },
  });

  // Track when the dialog opens and which certification is being edited
  const prevOpenRef = useRef(false);
  const prevCertIdRef = useRef<string | undefined>(undefined);
  
  // Reset form only when dialog opens OR when certification ID changes while open
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    const prevCertId = prevCertIdRef.current;
    const currentCertId = certification?.id;
    
    prevOpenRef.current = open;
    prevCertIdRef.current = currentCertId;
    
    // Reset when:
    // 1. Dialog transitions from closed to open (wasOpen=false, open=true)
    // 2. Certification ID changes while dialog is open
    const shouldReset = (open && !wasOpen) || (open && currentCertId !== prevCertId);
    
    if (shouldReset) {
      form.reset({
        name: certification?.name || "",
        issuingOrganization: certification?.issuingOrganization || "",
        issueDate: certification?.issueDate ? new Date(certification.issueDate) : undefined,
        expirationDate: certification?.expirationDate ? new Date(certification.expirationDate) : undefined,
        credentialId: certification?.credentialId || "",
        certificateUrl: certification?.certificateUrl || "",
        notes: certification?.notes || "",
        userId: certification?.userId || currentUserId || "",
      });
    }
  }, [open, certification, currentUserId, form]);

  const handleSubmit = (data: CertificationFormValues) => {
    // Convert Date objects to ISO strings (YYYY-MM-DD) before submitting
    const formattedData = {
      ...data,
      issueDate: data.issueDate.toISOString().split('T')[0],
      expirationDate: data.expirationDate.toISOString().split('T')[0],
      userId: isAdmin ? data.userId : currentUserId,
    };
    onSubmit(formattedData as unknown as CertificationFormValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {certification ? "Edit Certification" : "Add New Certification"}
          </DialogTitle>
          <DialogDescription>
            {certification
              ? "Update the details of this certification."
              : "Add a new professional certification to track."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {isAdmin && users.length > 0 && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to User</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                            {user.fullName} ({user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., AWS Solutions Architect"
                      {...field}
                      data-testid="input-cert-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuingOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuing Organization</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Amazon Web Services"
                      {...field}
                      data-testid="input-issuing-org"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Issue Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-issue-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-expiration-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ABC123XYZ"
                      {...field}
                      data-testid="input-credential-id"
                    />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for this certification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      data-testid="input-certificate-url"
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the certificate or verification page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this certification..."
                      className="resize-none"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-submit-cert">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {certification ? "Update" : "Add"} Certification
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
