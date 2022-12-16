# Bulgur Cloud - simple and delicious cloud storage and sharing

[![tests](https://img.shields.io/github/actions/workflow/status/SeriousBug/bulgur-cloud/coverage.yml?label=tests&branch=main)](https://github.com/SeriousBug/bulgur-cloud/actions/workflows/coverage.yml) [![Test coverage report](https://img.shields.io/codecov/c/github/SeriousBug/bulgur-cloud)](https://codecov.io/gh/SeriousBug/bulgur-cloud) [![lint checks](https://img.shields.io/github/actions/workflow/status/SeriousBug/bulgur-cloud/lint.yml?label=lint&branch=main)](https://github.com/SeriousBug/bulgur-cloud/actions/workflows/lint.yml) [![Audit status](https://img.shields.io/github/actions/workflow/status/SeriousBug/bulgur-cloud/audit.yml?label=audit&branch=main)](https://github.com/SeriousBug/bulgur-cloud/actions/workflows/audit.yml) [![Releases](https://img.shields.io/github/v/release/SeriousBug/bulgur-cloud?include_prereleases)](https://github.com/SeriousBug/bulgur-cloud/releases) [![Docker Image Size](https://img.shields.io/docker/image-size/seriousbug/bulgur-cloud)](https://hub.docker.com/r/seriousbug/bulgur-cloud) [![AGPL-3.0 license](https://img.shields.io/github/license/SeriousBug/bulgur-cloud)](https://github.com/SeriousBug/bulgur-cloud/blob/main/LICENSE.txt)

Bulgur cloud is a cloud storage and sharing option, designed to be easy to self
host. It depends on no databases or services, and uses little resources.

![Login scren](https://bgenc.net/img/2022-03-29-00-17-38.png)

## Demo

A read-only demo instance is now available at [bulgur-cloud.bgenc.net](https://bulgur-cloud.bgenc.net).

Enter the username `test` and password `test` to log in. This is set to be read only, so you will get an error if you try to upload, rename, or delete anything.

## Getting Started

See the demo above, and [my blog post](https://bgenc.net/bulgur-cloud-intro/) to get a sense of what Bulgur Cloud looks like.

If you like it, Bulgur Cloud has an experimental 0.1 release out now! Check the
[releases page](https://github.com/SeriousBug/bulgur-cloud/releases) to download
it as a self-contained binary which includes everything needed, or use the
[seriousbug/bulgur-cloud](https://hub.docker.com/r/seriousbug/bulgur-cloud)
docker image. Releases are available for Linux on x86_64, aarch64, armv7, and
arm; and for Windows on x86_64 only.

The releases are self contained, you don't need to set up a database or install
anything extra. The user interface is built into the released binary, so no
extra setup is needed.

### Binary

Download the binary that matches your system from the [releases page](https://github.com/SeriousBug/bulgur-cloud/releases), and extract it from the archive.
You can run this binary as a CLI command to add and remove users, or run it without commands to launch the server.

```bash
# Add users for the service, repeat for however many users you'd like to add
./bulgur-cloud user add --username name-for-user
# Start the service
./bulgur-cloud
```

The server will launch on port 8000 and will accept connections from all
addresses. This will be made configurable soon.

### Docker

Pull the [seriousbug/bulgur-cloud](https://hub.docker.com/r/seriousbug/bulgur-cloud)
image from DockerHub.

```bash
# Pull the docker image
docker pull seriousbug/bulgur-cloud:latest
# Create folders to store the data
mkdir -p users storage
# Add users for the service, repeat for however many users you'd like to add
docker run --rm -it -p 8000:8000 -v "$(pwd)/users":/users:rw -v "$(pwd)/storage":/storage:rw seriousbug/bulgur-cloud:latest user add --username name-for-user
# Start the service
docker run --rm -it -p 8000:8000 -v "$(pwd)/users":/users:rw -v "$(pwd)/storage":/storage:rw seriousbug/bulgur-cloud:latest
```

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
