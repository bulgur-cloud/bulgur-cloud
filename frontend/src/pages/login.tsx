import LabelledInput from "@/components/LabelledInput";
import Head from "next/head";

export default function Login() {
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
        <LabelledInput id="username" placeholder="jackson.mary">
          Username
        </LabelledInput>
        <LabelledInput type="password" id="password">
          Password
        </LabelledInput>
        <input
          className="btn btn-primary mt-8 px-8"
          type="button"
          value="Log in"
        />
      </main>
    </>
  );
}
