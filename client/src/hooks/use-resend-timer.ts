import { useState, useEffect, useCallback } from "react";

export function useResendTimer(cooldownSeconds = 60) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const startCooldown = useCallback(() => {
    setCountdown(cooldownSeconds);
  }, [cooldownSeconds]);

  return {
    countdown,
    canResend: countdown === 0,
    startCooldown,
  };
}
