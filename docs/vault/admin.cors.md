---
id: pu8wfspewd2ksnewj0aljkg
title: Cors
desc: ""
updated: 1658625132527
created: 1658614866479
---

When running a server, you can set the environment variable
`BULGUR_CLOUD_CORS_ORIGIN` to the domain or the IP address where the web
interface will be accessed from. This sets the [allowed origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
for all server resources to the specified origin.

The value should be a domain like `https://example.com`, an IP address like
`https://172.16.13.21`, or `*` to allow all origins. You can also set multiple IP
addresses or domains by separating them with spaces like `https://172.16.13.21,https://example.com`.

If this variable is not set, Bulgur Cloud will allow requests from all sources.
If set, they will be limited to the specified origin. This is used to protect
against [CSRF attacks](https://developer.mozilla.org/en-US/docs/Glossary/CSRF),
and to stop resources like images on the Bulgur Cloud server from being embedded
in other websites.

Bulgur Cloud uses special authentication headers and strict same-origin cookies
for authentication. This already protects your server against CSRF attacks, but
setting the CORS can serve as an additional layer of protection. It can also be
used to stop users of your server from embedding images hosted on the server in
other websites.
