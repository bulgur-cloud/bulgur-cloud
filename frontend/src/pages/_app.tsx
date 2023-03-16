import { ErrorDisplay } from "@/fragments/ErrorDisplay";
import { Navbar } from "@/fragments/Navbar";
import "@/styles/globals.css";
import { storeWrapper } from "@/utils/store";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ReactNode } from "react";
import { Provider } from "react-redux";

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title key="title">Bulgur Cloud</title>
        <meta
          key="description"
          name="description"
          content="Simple and delicious cloud sharing."
        />
        <meta
          key="viewport"
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link key="favicon" rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <ErrorDisplay />
      <div className="p-4">{children}</div>
    </>
  );
}

export default function App({ Component, ...rest }: AppProps) {
  const { store, props } = storeWrapper.useWrappedStore(rest);
  return (
    <Provider store={store}>
      <Layout>
        <Component {...props.pageProps} />
      </Layout>
    </Provider>
  );
}
