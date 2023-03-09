import { useLogin } from "@/hooks/auth";
import { useRunAsync } from "@/hooks/base";
import LabelledInput from "@/components/LabelledInput";
import Head from "next/head";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const { runAsync } = useRunAsync();
  const { doLogin } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const site =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : `${window.location.protocol}//${window.location.host}`;

  const login = useCallback(() => {
    runAsync(async () => {
      await doLogin({ username, password, site });
      setUsername("");
      setPassword("");
      router.push(`/s/${username}`);
    });
  }, [doLogin, password, runAsync, site, username, router]);

  return (
    <>
      <Head>
        <title>Bulgur Cloud</title>
        <meta name="description" content="Log into Bulgur Cloud." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-sm p-4 mt-12 mx-auto">
        <h1 className="text-4xl mb-4">Bulgur Cloud</h1>
        <p className="mb-8">Simple and delicious cloud storage and sharing.</p>
        <LabelledInput
          onChange={setUsername}
          id="username"
          placeholder="jackson.mary"
        >
          Username
        </LabelledInput>
        <LabelledInput
          onSubmit={login}
          onChange={setPassword}
          type="password"
          id="password"
        >
          Password
        </LabelledInput>
        <input
          className="btn btn-primary mt-8 px-8"
          type="button"
          value="Log in"
          onClick={login}
        />
      </main>
    </>
  );
}
