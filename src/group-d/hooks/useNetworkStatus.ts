import { useEffect, useState } from "react";

export interface NetworkStatus {
  /** Browser-reported network state; it does not guarantee the API is reachable. */
  isOnline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Refresh in case the connection changed between render and effect setup.
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
