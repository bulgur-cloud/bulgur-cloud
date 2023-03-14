import { useAppSelector } from "@/utils/store";
import Link from "next/link";
import { useCurrentPath } from "./CurrentPathProvider";

export function FileNotFound() {
  const { fullPath } = useCurrentPath();
  const username = useAppSelector((state) => state.auth.username);

  return (
    <>
      <h1 className="text-2xl mb-2">Not Found</h1>
      <p>
        The file or folder <span className="font-semibold">{fullPath}</span>{" "}
        does not exist.
      </p>
      <Link className="btn btn-primary m-4" href={`/s/${username ?? ""}`}>
        Go home
      </Link>
    </>
  );
}
