import { joinURL } from "@/utils/url";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";

type PathData =
  | {
      /** The current store we are in. */
      store: string;
      /** The current path within the store. */
      path: string;
      /** The full path, the store and path joined together. */
      fullPath: string;
      /** The name of the current file or folder, or the name of the store if we are at the top level. */
      name: string;
    }
  | undefined;

const PathContext = createContext<PathData>(undefined);

/**
 * A hook to get the current path data.
 *
 * Only available within PathDataProvider, which should only be used under `s/`
 * paths.
 */
export const useCurrentPath = () => {
  const context = useContext(PathContext);
  if (context === undefined) {
    throw new Error("usePathData must be used within a PathDataProvider");
  }
  return context;
};

/** Provide path data, and block all children until path data is ready.
 *
 * NextJS doesn't have the path data ready immediately when the page is first
 * rendered, so this component has to block all children until the path data is
 * ready.
 */
export function CurrentPathProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  if (!router.isReady) {
    return <></>;
  }

  // Safe to cast, because as long as this page is [...slug] we'll always get an array
  const { slug } = router.query;
  if (!Array.isArray(slug) || slug.length === 0) {
    throw new Error("PathDataProvider must be used under a `s/` path.");
  }
  const [store, ...path] = slug;
  const data: PathData = {
    store,
    name: path[path.length - 1] ?? store,
    fullPath: joinURL(store, ...path),
    path: joinURL(...path),
  };

  return <PathContext.Provider value={data}>{children}</PathContext.Provider>;
}
