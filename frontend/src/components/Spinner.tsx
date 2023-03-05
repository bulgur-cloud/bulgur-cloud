import { IconFidgetSpinner, IconRotateClockwise2 } from "@tabler/icons-react";

export function Spinner() {
  return <IconRotateClockwise2 className="animate-spin w-12 h-12" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <Spinner />
    </div>
  );
}
