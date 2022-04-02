---
id: yjadwudtv49amsbo5nks9j0
title: Auth
desc: ''
updated: 1646362076390
created: 1646359700863
---

### login
- `POST /auth/login`
- Request example:
  ```json
  {
    "username": "me",
    "password": "my-password",
  }
  ```
- Response example:
  ```json
  {
      "token": "3eoLWU12IAFgtThIsEeTw",
      "valid_for_seconds": 86400
  }
  ```

Make a login attempt. This endpoint is heavily throttled, by default at 10
requests per minute. If you make too many attempts, you'll receive a `429 Too
Many Requests` error.

The token is not guaranteed to be valid for the time specified in the response.
For example, a server restart may cause tokens to become invalid. See
[[stats|api.meta#head-stats]] on how to check if a token is valid.

You should save the username and password, and re-login if the token becomes invalid.
