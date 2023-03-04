import "@/styles/globals.css";
import { storeWrapper } from "@/utils/store";
import type { AppProps } from "next/app";

export function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default storeWrapper.withRedux(App);
