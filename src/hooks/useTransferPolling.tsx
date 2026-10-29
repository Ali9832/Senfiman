import { useEffect, useRef } from "react";

/**
 * Refreshes the transfer list periodically without a Supabase Realtime channel.
 */
export function useTransferPolling(onChange: () => void, enabled: boolean) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => onChangeRef.current(), 20_000);
    return () => window.clearInterval(interval);
  }, [enabled]);
}
