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

If you'd like to help with development, use Visual Studio Code to open the
project folder. You must have a working rust and nodejs setup. There are tasks
set up to build and run the backend and frontend. The backend requires a bit of
setup as you need to create a user for testing. There is no documentation for
this right now, but let me know if you are interested and I'll help with the
setup.

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

There is a Playwright test suite. You can run it inside the `bulgur-cloud-frontend` folder with:

```sh
# You need to install browsers first if you haven't used playwright before
yarn playwright install
# Then, you can run the tests. By default it tests with Firefox and Chromium.
yarn test
```
