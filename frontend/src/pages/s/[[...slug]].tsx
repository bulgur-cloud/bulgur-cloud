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
import { UploadButton } from "@/fragments/s/UploadButton";
import { UploadProgress } from "@/fragments/s/Slideouts/UploadProgress";
import { NewFolderButton } from "@/fragments/s/NewFolderButton";
import { ModalSelector } from "@/fragments/s/ActionModal/ModalSelector";
import { Selection } from "@/fragments/s/Slideouts/Selection";
import Link from "next/link";

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
        <title key="title">{name} - Bulgur Cloud</title>
        <meta
          key="description"
          name="description"
          content={`Contents of ${name} on Bulgur Cloud.`}
        />
      </Head>
      <main className="max-w-prose mt-12 mx-auto">
        <div className="flex flex-row my-4">
          <UploadButton />
          <UploadProgress />
          <Selection />
          <NewFolderButton />
          <ModalSelector />
        </div>
        <PathBreadcrumbs />
        <StoreViewInner />
      </main>
    </>
  );
}

function Dashboard() {
  const username = useAppSelector((state) => state.auth.username);
  // TODO: This could show all stores as cards, and display stats about those
  // stores. Maybe even let users pick colors or attach tags to stores. Or take
  // notes about stores!
  return (
    <>
      <Head>
        <title>{username}&#39;s Dashboard - Bulgur Cloud</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-prose p-4 mt-12 mx-auto">
        <h2 className="text-xl mb-8">Your stores</h2>
        <ul className="list-disc">
          <Link href={`/s/${username}`}>
            <li>{username}</li>
          </Link>
        </ul>
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
