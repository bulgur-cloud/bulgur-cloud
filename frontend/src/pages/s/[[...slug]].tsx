import Head from "next/head";
import { usePathMeta } from "@/hooks/storage";
import {
  CurrentPathProvider,
  useCurrentPath,
} from "@/fragments/s/CurrentPathProvider";
import { useEnsureAuthInitialized } from "@/hooks/auth";
import { FullPageSpinner } from "@/components/Spinner";
import { FolderList } from "@/fragments/s/FolderList";

function useCurrentPathMeta() {
  const { fullPath } = useCurrentPath();
  return usePathMeta(fullPath);
}

export function StoreView() {
  const { name } = useCurrentPath();
  const { data } = useCurrentPathMeta();
  if (!data) {
    return <FullPageSpinner />;
  }
  const { exists, isFile } = data;

  return (
    <>
      <Head>
        <title>{name} - Bulgur Cloud</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-sm p-4 mt-12 mx-auto">
        <h1 className="text-4xl mb-4">{name}</h1>
        <p className="mb-8">Youre in: {JSON.stringify({ exists, isFile })}</p>
        <FolderList />
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
