---
id: w3e6dhqnafgvjkkh1qkam8t
title: Storage
desc: ''
updated: 1646360784842f
created: 1646360652951
---

### GET storage
- `GET /storage/<user>/<...path>`
- Response for folders
  ```json
  {
      "entries": [
          {
              "is_file": true,
              "name": "sprite-fright.mp4",
              "size": 102392846
          },
          {
              "is_file": false,
              "name": "test-folder",
              "size": 4096
          },
          {
              "is_file": true,
              "name": "sprite-fright.LICENSE.txt",
              "size": 67
          }
      ]
  }
  ```
- For files, response is the actual file contents.

If the file or folder is missing, it will instead return `404 Not Found`.

The "root" for each user is the path `/storage/<user>/`.
The trailing slash is required for the root.

#### usage with path tokens
In some environments, such as browsers, it can be hard to add headers to some
requests. For example, when the browser itself makes a request to display an
image, adding a header to that request is not straightforward.

In those cases, and only for `GET` and `HEAD` requests, you can use a [[path token|#path-tokens]]
instead to authorize the request. Path tokens are added to the query string
instead, which is often easier.

- Example request path: `/storage/<user>/sprite-fright.mp4?token=da-F8tP-u1D2x_6A55RIA`

### HEAD storage
- `HEAD /storage/<user>/<...path>`

Same as the `GET` request, but only the headers. This can be used to check if a
file or folder exists or not, or whether the user is authorized to access it.

### POST storage
- `HEAD /storage/<user>/<...path>`

`POST` requests can be used to perform some actions on the files and folders.

#### path tokens
- Request example
  ```json
  {"action": "MakePathToken"}
  ```
- Response example
  ```json
  {"token": "1EKSCRaTYpQTSrFT5RWRC"}
  ```

The token you get from this endpoint is a path token. Path tokens can be used in
place of the regular auth tokens, but only when accessing the exact path they
were created for, and only for `GET` and `HEAD` requests. Instead of headers,
path tokens are added to the query string.

#### move (rename)

### PUT storage
- `PUT /storage/<user>/<...path>`

You can send a multipart request to upload one or more files.

### DELETE storage
- `DELETE /storage/<user>/<...path>`

You can send a delete request to delete whatever is at that path. Both files and
folders can be deleted. Folders will be deleted **recursively**, meaning all
contents of the folder are also deleted.

Right now there is no trash system, so deletions are permanent.
