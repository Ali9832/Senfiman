import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PUBLIC_TEST_MODE } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;
  if (!user && PUBLIC_TEST_MODE) return <div className="min-h-screen flex flex-col gap-4 items-center justify-center text-center" dir="rtl"><p>اتصال به سرور برقرار نشد. لطفاً دوباره تلاش کنید.</p><button className="underline" onClick={() => void refresh()}>تلاش دوباره</button></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
