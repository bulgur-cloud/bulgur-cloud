---
id: knlw4zitbb8ru0n0e5a0voa
title: Client
desc: ""
updated: 1653759892089
created: 1653754174834
---

[[client.ts|../bulgur-cloud-frontend/src/client/client.ts]] contains hooks that
allow us to send requests. The hooks are based on [SWR](https://swr.vercel.app/),
which handles caching and revalidation for us.

## Adding a new hook that fetches data

Start with this format:

```ts
export function useThing() {
  return useFetch<api.TypeForRequest, api.TypeForResponse>({
    method: "GET or HEAD or whatever",
    "/url/to/thing",
  });
  // Instead of immediately returning `useRequest`, you can also add
  // some code to transform the response you get from it.
}
```

## Adding a new hook that does an action

Start with this format:

```ts
export function useThing() {
  const { site, token } = useAppSelector((selector) => selector.auth);
  const dispatch = useAppDispatch();
  const { doRequest } = useRequest();

  async function doThing() {
    // Do whatever here to do the action
    const out = await doRequest(/* ... */);
    // Then, update the state with redux
    dispatch(slice.action.thing());
  }

  return { doThing };
}
```
