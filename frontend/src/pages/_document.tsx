import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-theme="light">
      <Head />
      <body>
        {/* The following script does need to be sync, because we want it to set the theme from local storage before anything gets rendered. Otherwise there will be a flash of unthemed content.
            The script is tiny, so the performance impact is negligible. */}
        {/* eslint-disable @next/next/no-sync-scripts */}
        <script type="text/javascript" src="/theme-setter.js" />
        <Main />
        <div id="bulgur-portal-root" />

        {/* TLDR: Without the following element, focus on dropdowns/modals in the portal is wonky.
        
        The user is on the last tab-able element within the portal, and then they tab forward.
        What happens? There is no more focusable elements on the page, so the focus goes to a piece of the browser itself.
        This is bad, because the browser will now ignore any attempts by us to take the focus back to some part of the page.
        Components inside the portal, like dropdowns, manage their own focus state. When the user tabs out of them, they need to bring the focus back to the element that triggered the dropdown in the first place.
        But because the browser will now block focus attempts, they won't be able to do so.
        The user's focus jumped from somewhere in the middle of the page to the end of the page and past it.
        Adding this dummy element keeps the focus in the page just for one more tab, and gives us a chance to fix the focus before it escapes us.
        At the same time, it won't prevent a user from tabbing out of the page and into the browser if they need to. They just need to hit tab one more time.
        */}
        <div
          aria-label="end of page"
          id="bulgur-dummy-keep-focus-in-portal"
          tabIndex={0}
        />
        <NextScript />
      </body>
    </Html>
  );
}
