---
id: pyivex7e4t9uujyn2ywllta
title: Meta
desc: ''
updated: 1646470753100
created: 1646360039183
---


### GET stats
- `GET /api/stats`
- Example response:
  ```json
  {
    "uptime": "PT575.500660435S"
  }
  ```

This endpoint gives you stats about the server. Currently this is very limited,
please send a feature request if you'd like to see more stats available.

### HEAD stats
- `HEAD /api/stats`

You can use the stats endpoint to verify if a token is valid. A `HEAD` request
to this endpoint is very cheap to process, and will only fail if the token is
invalid.

If the token is valid, you will get a `200 OK` response, and if the token is
invalid you will get a `401 Unauthorized` response.

### is_bulgur_cloud
- `HEAD /is_bulgur_cloud`

This endpoint is not protected, and always returns `200 OK`. You can use this to
check if a server is running Bulgur Cloud.
