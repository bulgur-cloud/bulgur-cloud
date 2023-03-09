import Head from "next/head";
import { usePathMeta } from "@/hooks/storage";
import {
  CurrentPathProvider,
  useCurrentPath,
  useCurrentPathFromRouter,
} from "@/fragments/s/CurrentPathProvider";
import { useEnsureAuthInitialized } from "@/hooks/auth";
import { FullPageSpinner } from "@/components/Spinner";
import { FolderList } from "@/fragments/s/FolderList";
import { FileNotFound } from "@/fragments/s/NotFound";
import { FilePreview } from "@/fragments/s/FilePreview";
import { PathBreadcrumbs } from "@/fragments/s/PathBreadcrumbs";
import { useAppSelector } from "@/utils/store";
import { useRouter } from "next/router";
import { Navbar } from "@/fragments/Navbar";

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
      <Navbar />
      <main className="max-w-prose p-4 mt-12 mx-auto">
        <PathBreadcrumbs />
        <StoreViewInner />
      </main>
    </>
  );
}

function Dashboard() {
  const username = useAppSelector((state) => state.auth.username);
  // TODO Needs to be actually implemented! There is not much point in this
  // right now because the user can only have one store, but we could list all
  // their stores and all files shared with them etc. here once those exist
  return (
    <>
      <Head>
        <title>{username}&#39;s Dashboard - Bulgur Cloud</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-prose p-4 mt-12 mx-auto">
        <p>{username}</p>
      </main>
    </>
  );
}

export default function StoreViewWrapper() {
  const state = useEnsureAuthInitialized();
  const { isLoading, data } = useCurrentPathFromRouter();

  if (state === "loading" || isLoading) {
    return <FullPageSpinner />;
  }

  if (!data) {
    return <Dashboard />;
  }

  return (
    <CurrentPathProvider>
      <StoreView />
    </CurrentPathProvider>
  );
}