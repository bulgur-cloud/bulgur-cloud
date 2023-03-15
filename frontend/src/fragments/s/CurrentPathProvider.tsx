import { FullPageSpinner } from "@/components/Spinner";
import { joinURL } from "@/utils/url";
import { useRouter } from "next/router";
import { createContext, ReactNode, useContext } from "react";

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

/** Gets the current path from the router.
 *
 * Avoid using this, use {@link useCurrentPath} instead.
 *
 * Unlike `useCurrentPath', this hook is
 * available outside of `PathDataProvider`, but it has a loading state because
 * the router isn't ready immediately.
 */
export function useCurrentPathFromRouter() {
  const router = useRouter();
  if (!router.isReady) {
    return { isLoading: true };
  }

  const { slug } = router.query;
  if (!Array.isArray(slug) || slug.length === 0) {
    return { isLoading: false, data: undefined };
  }

  const [store, ...path] = slug;
  const data: PathData = {
    store,
    name: path[path.length - 1] ?? store,
    fullPath: joinURL(store, ...path),
    path: joinURL(...path),
  };
  return { isLoading: false, data };
}

/**
 * A hook to get the current path data.
 *
 * Only available within PathDataProvider, which should only be used under `s/`
 * paths. Unlike {@link useCurrentPathFromRouter}, this hook's data is
 * immediately avaiable without a loading state.
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
export function CurrentPathProvider({ children }: { children: ReactNode }) {
  const { isLoading, data } = useCurrentPathFromRouter();
  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (data === undefined) {
    throw new Error("PathDataProvider must be used under a `s/` path.");
  }

  return <PathContext.Provider value={data}>{children}</PathContext.Provider>;
}
