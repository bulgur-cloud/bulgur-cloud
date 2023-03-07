import { IconLoader2 } from "@tabler/icons-react";

export function Spinner() {
  return (
    <div className="relative">
      <IconLoader2 className="animate-spin w-12 h-12" />
      <IconLoader2 className="absolute animate-spin-counter-clockwise w-8 h-8 left-2 top-2" />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <Spinner />
    </div>
  );
}
