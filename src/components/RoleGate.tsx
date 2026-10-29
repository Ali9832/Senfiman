import { useAuth, Role } from "@/hooks/useAuth";
import type { Permission } from "@/lib/access";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RoleGate({
  role,
  roles,
  permission,
  permissions,
  children,
}: {
  role?: Role;
  roles?: Role[];
  permission?: Permission;
  permissions?: Permission[];
  children: React.ReactNode;
}) {
  const { hasRole, hasAnyRole, can, loading } = useAuth();
  if (loading) return null;
  const allowed =
    (permission ? can(permission) : false) ||
    (permissions ? permissions.some((item) => can(item)) : false) ||
    (role ? hasRole(role) : false) ||
    (roles ? hasAnyRole(...roles) : false);
  if (!allowed) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-destructive/40">
          <CardContent className="py-10 text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">دسترسی محدود</h2>
            <p className="text-sm text-muted-foreground">
              نقش یا محدوده سازمانی شما اجازه ورود به این بخش را نمی‌دهد.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
