import { IconLoader2 } from "@tabler/icons-react";

export function Spinner() {
  return (
    <div style={{ position: "relative" }}>
      <IconLoader2 className="animate-spin w-12 h-12" />
      <IconLoader2
        style={{ position: "absolute", top: 8, left: 8 }}
        className="animate-spin-counter-clockwise w-8 h-8"
      />
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
