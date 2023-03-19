import { useLocalStorageState } from "@/hooks/local-storage";
import { useBanner } from "@/hooks/meta";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useCallback } from "react";

export function Banner({ bannerKey }: { bannerKey: "page" | "login" }) {
  const banner = useBanner(bannerKey);
  // If isDismissed is anything other than null, then we've dismissed the banner
  const [isDismissed, setIsDismissed] = useLocalStorageState(bannerKey);

  const onDismiss = useCallback(() => {
    setIsDismissed("dismissed");
  }, [setIsDismissed]);

  if (!banner || isDismissed !== null) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="bg-base-200 rounded-box m-4 p-4 shadow-lg mb-8 max-w-prose flex flex-row items-center">
        <IconInfoCircle className="w-6 h-6 mr-2 flex-shrink-0" />
        <span>{banner}</span>
        <div className="flex-grow" />
        <button className="btn btn-ghost btn-square" onClick={onDismiss}>
          <IconX />
        </button>
      </div>
    </div>
  );
}
