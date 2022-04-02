---
id: ai0rrgkg3yqjnl39mlxpflf
title: API
desc: ''
updated: 1646360653143
created: 1646358873945
---

This is a description of the Bulgur Cloud API.

The API is split into 3 parts: [[Auth|#auth]], [[Meta|#meta]], and [[Storage|#storage]].

## Auth

To use any endpoint in the [[Meta|#meta]] or [[Storage|#storage]], you will first need an authorization token.
See the [[api.auth]] for details.

Once you have acquired an authorization token, you must attach this token to all
requests with the `authorization` header. This looks like `authorization: 

## Meta

The meta API gives you metadata about the server, and allows you to validate
authorization tokens. See [[api.meta]] for details.

## Storage

The storage API gives you access and control to the stored files and folders.
Endpoints in this api are an exception to the authorization. See [[api.storage]]
for details.