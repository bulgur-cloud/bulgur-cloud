import { useEnsureAuthInitialized, useLogin } from "@/hooks/auth";
import { useRunAsync } from "@/hooks/base";
import LabelledInput from "@/components/LabelledInput";
import Head from "next/head";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";

export default function Settings() {
  useEnsureAuthInitialized();

  return (
    <>
      <Head>
        <title>Settings - Bulgur Cloud</title>
        <meta
          name="description"
          content="Change your Bulgur Cloud account settings."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-sm p-4 mt-12 mx-auto">
        <h1 className="text-4xl mb-4">Settings</h1>
      </main>
    </>
  );
}
