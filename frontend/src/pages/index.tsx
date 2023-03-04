import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";

function ProseSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="max-w-prose mx-auto mt-8">
      <h2 className="text-4xl mb-4">{heading}</h2>
      <p>{children}</p>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Bulgur Cloud</title>
        <meta
          name="description"
          content="Simple and delicious cloud sharing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <section className="max-w-prose mx-auto mt-8">
          <h1 className="text-6xl">Bulgur Cloud</h1>
          <p className="text-xl mt-2">Simple and delicious cloud sharing.</p>
        </section>
        <section className="max-w-prose mx-auto mt-8">
          <Link href="/login" className="btn btn-primary px-8">
            Log in
          </Link>
        </section>
        <ProseSection heading="What is Bulgur Cloud?">
          Bulgur Cloud is a self-hostable cloud storage solution. You can upload
          and download files, organize them, and share them with others.
          Everything stays on computers or servers you own, so you have complete
          control and trust over your data.
        </ProseSection>
        <ProseSection heading="What is this website?">
          This is an instance of Bulgur Cloud, hosted by someone. If you are the
          person hosting this instance, or if you have been given a login from
          the person who is, you can log in by clicking the button above.
        </ProseSection>
      </main>
    </>
  );
}
