import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type ApiUser } from "@/lib/api";
import { FULL_ACCESS_ROLES, hasPermission, type Permission, type Role } from "@/lib/access";

export type { Role } from "@/lib/access";
export { ROLE_LABELS } from "@/lib/access";

type Ctx = {
  user: ApiUser | null;
  roles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (...rs: Role[]) => boolean;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const { user: currentUser } = await api<{ user: ApiUser }>("/api/auth/me");
      setUser(currentUser);
      setRoles(currentUser.roles as Role[]);
    } catch {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        loading,
        signOut: async () => {
          await api("/api/auth/logout", { method: "POST" });
          setUser(null);
          setRoles([]);
        },
        refresh,
        hasRole: (r) => roles.includes(r),
        hasAnyRole: (...rs) => rs.some((r) => roles.includes(r)),
        can: (permission) => user?.permissionOverrides ? user.permissionOverrides.includes(permission) : hasPermission(roles, permission),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
