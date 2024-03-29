import { ThemePicker } from "@/fragments/settings/ThemePicker";
import { useEnsureAuthInitialized } from "@/hooks/auth";
import Head from "next/head";

export default function Settings() {
  useEnsureAuthInitialized();

  return (
    <>
      <Head>
        <title key="title">Settings - Bulgur Cloud</title>
        <meta
          key="description"
          name="description"
          content="Change your Bulgur Cloud account settings."
        />
      </Head>
      <main className="max-w-prose mt-12 mx-auto">
        <h1 className="text-4xl mb-4">Settings</h1>
        <section>
          <h2 className="text-2xl mb-4">Theme</h2>
          <ThemePicker />
        </section>
      </main>
    </>
  );
}
