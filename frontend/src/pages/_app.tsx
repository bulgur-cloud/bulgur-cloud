import "@/styles/globals.css";
import { storeWrapper } from "@/utils/store";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";

export default function App({ Component, ...rest }: AppProps) {
  const { store, props } = storeWrapper.useWrappedStore(rest);
  return (
    <Provider store={store}>
      <Component {...props.pageProps} />
    </Provider>
  );
}
