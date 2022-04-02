---
id: 2wji4295zgv0zbu6uerddgu
title: Design
desc: ''
updated: 1648930550797
created: 1645911683356
---

We describe the internal design of Bulgur Cloud here.

## API

Bulgur cloud exposes all functionality through an API, which is used by all front ends.

### Authentication

Authentication is done through the `/api/login` endpoint.

### Authorization

There are 2 ways to authorize. First is by attaching the token returned by the
login endpoint as the `authorization` token.

Second, for **storage endpoints only** and for **safe operations only** (namely
`GET`, `HEAD`, `OPTIONS`), you can attach a path token to the query string with
the token parameter. This looks like `/storage/...?token=...`.
See [[path tokens|api.storage#path-tokens]] for details.
