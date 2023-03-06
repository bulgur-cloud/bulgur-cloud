import Link from "next/link";
import { useCurrentPath } from "./CurrentPathProvider";

export function FileNotFound() {
  const { fullPath, store } = useCurrentPath();

  return (
    <>
      <h1 className="text-2xl mb-2">Not Found</h1>
      <p>
        The file or folder <span className="font-semibold">{fullPath}</span>{" "}
        does not exist.
      </p>
      <Link className="btn btn-primary m-4" href={`/s/${store}`}>
        Go home
      </Link>
    </>
  );
}
