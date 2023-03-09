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
        <title key="title">Settings - Bulgur Cloud</title>
        <meta
          key="description"
          name="description"
          content="Change your Bulgur Cloud account settings."
        />
      </Head>
      <main className="max-w-prose mt-12 mx-auto">
        <h1 className="text-4xl mb-4">Settings</h1>
      </main>
    </>
  );
}
