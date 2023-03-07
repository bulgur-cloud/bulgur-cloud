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
import { FilePreview } from "@/fragments/s/FilePreview";
import { PathBreadcrumbs } from "@/fragments/s/PathBreadcrumbs";

function useCurrentPathMeta() {
  const { fullPath } = useCurrentPath();
  return usePathMeta(fullPath);
}

function StoreViewInner() {
  const { data } = useCurrentPathMeta();
  if (!data) {
    return <FullPageSpinner />;
  }
  const { exists, is_file: isFile } = data;
  if (!exists) {
    return <FileNotFound />;
  }
  if (!isFile) {
    return <FolderList />;
  }
  return <FilePreview />;
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
      <main className="max-w-prose p-4 mt-12 mx-auto">
        <PathBreadcrumbs />
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
