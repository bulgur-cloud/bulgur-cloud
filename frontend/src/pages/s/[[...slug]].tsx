import Head from "next/head";
import { usePathMeta } from "@/hooks/storage";
import {
  CurrentPathProvider,
  useCurrentPath,
} from "@/fragments/s/CurrentPathProvider";
import { useEnsureAuthInitialized } from "@/hooks/auth";
import { FullPageSpinner } from "@/components/Spinner";
import { FolderList } from "@/fragments/s/FolderList";
import { FileNotFound } from "@/fragments/s/NotFound";

function useCurrentPathMeta() {
  const { fullPath } = useCurrentPath();
  return usePathMeta(fullPath);
}

function StoreViewInner() {
  const { data } = useCurrentPathMeta();
  if (!data) {
    return <FullPageSpinner />;
  }
  const { exists, isFile } = data;
  if (!exists) {
    return <FileNotFound />;
  }
  if (!isFile) {
    return <FolderList />;
  }
  // TODO
  return <p>File</p>;
}

function StoreView() {
  const { name } = useCurrentPath();

  return (
    <>
      <Head>
        <title>{name} - Bulgur Cloud</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-sm p-4 mt-12 mx-auto">
        <StoreViewInner />
      </main>
    </>
  );
}

export default function StoreViewWrapper() {
  const state = useEnsureAuthInitialized();
  if (state === "loading") {
    return <FullPageSpinner />;
  }
  return (
    <CurrentPathProvider>
      <StoreView />
    </CurrentPathProvider>
  );
}
