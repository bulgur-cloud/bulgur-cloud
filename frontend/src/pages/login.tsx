import { useLogin } from "@/hooks/auth";
import { useRunAsync } from "@/hooks/base";
import LabelledInput from "@/components/LabelledInput";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { pick, shallowEquals } from "@/utils/object";
import { useAppSelector } from "@/utils/store";
import { getWindow } from "@/utils/window";

export default function Login() {
  const {
    username: loggedInUsername,
    access_token,
    state: authState,
  } = useAppSelector(
    (state) => pick(state.auth, "username", "access_token", "state"),
    shallowEquals,
  );
  const router = useRouter();
  const { runAsync } = useRunAsync();
  const { doLogin } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const site =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : `${getWindow()?.location.protocol}//${getWindow()?.location.host}`;

  const login = useCallback(() => {
    runAsync(async () => {
      await doLogin({ username, password, site });
      setUsername("");
      setPassword("");
      router.push(`/s/${username}`);
    });
  }, [doLogin, password, runAsync, site, username, router]);

  useEffect(() => {
    console.log(loggedInUsername, access_token, authState);
    if (loggedInUsername && access_token && authState === "done") {
      router.push(`/s/${loggedInUsername}`);
    }
    // We only want this to run ONCE at the start, otherwise it will re-trigger
    // after we login and override the login redirect, if any.
  }, [access_token, authState, loggedInUsername, router]);

  return (
    <>
      <Head>
        <title key="title">Log in - Bulgur Cloud</title>
        <meta
          key="description"
          name="description"
          content="Log into Bulgur Cloud."
        />
      </Head>
      <main className="max-w-sm mt-12 mx-auto">
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
