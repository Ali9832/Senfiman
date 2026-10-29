import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link2, Unlink, Loader2, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type System = "food" | "library" | "internet";

interface Props {
  system: System;
  functionName: string;
  title: string;
  description: string;
  icon: LucideIcon;
  hostLabel: string;
}

export default function SystemConnect({ system, functionName, title, description, icon: Icon, hostLabel }: Props) {
  const { user } = useAuth();
  const [connected, setConnected] = useState<{ username: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("university_credentials")
      .select("username")
      .eq("user_id", user.id)
      .eq("system", system)
      .maybeSingle()
      .then(({ data }) => setConnected(data ?? null));
  }, [user, system]);

  const save = async () => {
    if (!username || !password) return toast.error("کد دانشجویی و رمز را وارد کنید");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { action: "save_creds", username, password },
    });
    setBusy(false);
    if (error || !data?.ok) return toast.error("ذخیره ناموفق: " + (error?.message ?? data?.error ?? ""));
    toast.success("اتصال ذخیره شد");
    setConnected({ username });
    setOpen(false);
    setPassword("");
  };

  const disconnect = async () => {
    setBusy(true);
    await supabase.functions.invoke(functionName, { body: { action: "delete_creds" } });
    setBusy(false);
    setConnected(null);
    toast.success("اتصال قطع شد");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connected ? (
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900 mb-1">
                <Link2 className="h-3 w-3 ml-1" /> متصل
              </Badge>
              <p className="text-sm text-muted-foreground">کد: {connected.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={disconnect} disabled={busy} className="gap-1">
              <Unlink className="h-3 w-3" /> قطع اتصال
            </Button>
          </div>
        ) : !open ? (
          <>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button onClick={() => setOpen(true)} size="sm">اتصال به {hostLabel}</Button>
          </>
        ) : (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">کد دانشجویی</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label className="text-xs">رمز عبور سامانه</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              رمز به‌صورت رمزنگاری‌شده ذخیره می‌شود و فقط برای استعلام از {hostLabel} استفاده می‌شود.
            </p>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy} size="sm" className="gap-1">
                {busy && <Loader2 className="h-3 w-3 animate-spin" />} ذخیره
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>انصراف</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
