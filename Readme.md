# Bulgur Cloud - simple and delicious cloud storage and sharing

[![tests](https://img.shields.io/github/actions/workflow/status/bulgur-cloud/bulgur-cloud/coverage.yml?label=tests&branch=main)](https://github.com/bulgur-cloud/bulgur-cloud/actions/workflows/coverage.yml)
[![Test coverage report](https://img.shields.io/codecov/c/github/bulgur-cloud/bulgur-cloud)](https://codecov.io/gh/bulgur-cloud/bulgur-cloud)
[![lint checks](https://img.shields.io/github/actions/workflow/status/bulgur-cloud/bulgur-cloud/lint.yml?label=lint&branch=main)](https://github.com/bulgur-cloud/bulgur-cloud/actions/workflows/lint.yml)
[![Audit status](https://img.shields.io/github/actions/workflow/status/bulgur-cloud/bulgur-cloud/audit.yml?label=audit&branch=main)](https://github.com/bulgur-cloud/bulgur-cloud/actions/workflows/audit.yml)
[![Releases](https://img.shields.io/github/v/release/bulgur-cloud/bulgur-cloud?include_prereleases)](https://github.com/bulgur-cloud/bulgur-cloud/releases)
[![Docker Image Size](https://img.shields.io/docker/image-size/seriousbug/bulgur-cloud)](https://hub.docker.com/r/seriousbug/bulgur-cloud)
[![AGPL-3.0 license](https://img.shields.io/github/license/bulgur-cloud/bulgur-cloud)](https://github.com/bulgur-cloud/bulgur-cloud/blob/main/LICENSE.txt)

Bulgur cloud is a cloud storage and sharing option, designed to be easy to self
host. It depends on no databases or services, and uses little resources.

![Login scren](https://bgenc.net/img/bulgur-cloud-2022-12-30.png)

## Demo

A read-only demo instance is now available at [bulgur-cloud.bgenc.net](https://bulgur-cloud.bgenc.net).

Enter the username `test` and password `test` to log in. This is set to be read only, so you will get an error if you try to upload, rename, or delete anything.

## Getting Started

Please see our docs here: [bulgur-cloud.github.io](https://bulgur-cloud.github.io/)

## Development

[![Open in Dev Containers](https://img.shields.io/static/v1?label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/bulgur-cloud/bulgur-cloud)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=458418034)

Please see the [developer documentation](https://bulgur-cloud.github.io/docs/developers/dev-docs/dev-env) to get started.
You can use Dev Containers to start up immediately if you have VSCode and Docker installed.
Otherwise you can set up a local development environment.

### Tests

#### Backend

To run tests, please run them single-threaded.

```sh
cargo test -- --test-threads=1
```

Tests create and use a test folder, and because they run in the same process
this can't be parallelized. We'll make the file access parts modularized
eventually so this won't be required.

#### Frontend

There is a Playwright test suite. You can run it inside the `frontend` folder with:

```sh
# You need to install browsers first if you haven't used playwright before
yarn playwright install
# Then, you can run the tests. By default it tests with Firefox and Chromium.
yarn test
```
