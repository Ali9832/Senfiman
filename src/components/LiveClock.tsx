import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatJalali, toFa } from "@/lib/jalali";

export default function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = toFa(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{time}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <Clock className="h-4 w-4 text-primary" />
      <span className="font-mono font-semibold tabular-nums">{time}</span>
      <span className="text-muted-foreground">— {formatJalali(now)}</span>
    </div>
  );
}
