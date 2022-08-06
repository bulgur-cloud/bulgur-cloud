#!/bin/bash
#
# This script builds the server with profile guided optimizations (PGO) enabled,
# then runs the server and collects a profile by making requests against the
# server. This creates PGO information that can be used in a release build,
# resulting in around 15% performance increase.
#
# The process is somewhat manual right now, but hopefully will be automated
# later.
#
# This script requires:
# - cargo (duh)
# - base64
# - curl
# - llvm-profdata (part of llvm package in most distros)
#
shopt -s extglob
# Trap errors and interrupts
set -Eeuo pipefail
function handle_sigint() {
  echo "SIGINT, exiting..."
  kill -s 9 -- "${server_pid}"
  exit 1
}
trap handle_sigint SIGINT
function handle_err() {
  echo "Error in run.sh!" 1>&2
  echo "$(caller): ${BASH_COMMAND}" 1>&2
  echo "Exiting..."
  kill -s 9 -- "${server_pid}"
  exit 2
}
trap handle_err ERR

# Go to the root of the project
SCRIPT=$(realpath "${0}")
SCRIPTPATH=$(dirname "${SCRIPT}")
cd "${SCRIPTPATH}" || exit 12

function random() {
  head --bytes 16 /dev/urandom | base64
}

# Cleanup
rm -rf pgo-data      # clean up any PGO data left over
rm -rf storage users # clean up any testing data left over

echo 'Building the server...'
env RUSTFLAGS="-Cprofile-generate=/tmp/bulgur-cloud-pgo-data" cargo build --release --target=x86_64-unknown-linux-gnu
BIN='./target/x86_64-unknown-linux-gnu/release/bulgur-cloud'

## Add several test users
echo 'Adding test users'
$BIN user add --username 'test' --password 'test'
$BIN user add --username 'BunGoth' --password 'DKgHpz6M'
$BIN user add --username '123Alarm' --password 'TEuM9CovvDZ9x2NmGCNd'
$BIN user add --username 'SerialTest' --password 'GYQSznR5&bEDqAu5W?wN7qj5V7mnatZEETp@2%q&H+KYHXDV'

# Run server in background
$BIN >/dev/null &
server_pid=$!

# Wait until server is ready
echo 'Waiting for server to start up...'
while true; do
  sleep 1
  if curl --silent -I http://localhost:8000/is_bulgur_cloud | grep '200 OK'; then
    break
  fi
done

echo 'Server has started, running benchmark'
echo
echo "Benchmark start =====> $(date +'%Y-%m-%d-%H-%M-%S-%N')"
echo

# Now, get an actual token so we can test out the API
token=$(curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"test","password":"test"}' | jq -r .token)

# First, log in as a bunch of users. These will be successful logins.
for _i in {1..100}; do
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"test","password":"test"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"BunGoth","password":"DKgHpz6M"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"123Alarm","password":"TEuM9CovvDZ9x2NmGCNd"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"SerialTest","password":"GYQSznR5&bEDqAu5W?wN7qj5V7mnatZEETp@2%q&H+KYHXDV"}' >/dev/null
done
# Then, a bunch of failed logins
for _i in {1..100}; do
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"test","password":"xaaz"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"BunGoth","password":"TEuM9CovvDZ9x2NmGCNd"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"123Alarm","password":"FYQSznR5&bEDqAu5W?wN7qj5V7mnatZEETp@2%q&H+KYHXDV"}' >/dev/null
  curl --silent -X POST http://localhost:8000/auth/login -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"username":"SerialTest","password":"FYQSznR5&bEDqAu5W?wN7qj5V7mnatZEETp@2%q&H+KYHXDV"}' >/dev/null
done

# Get the stats
for _i in {1..100}; do
  curl --silent -X GET http://localhost:8000/api/stats -H "authorization: ${token}" >/dev/null
done
# Check the root folder
for _i in {1..100}; do
  curl --silent -X GET http://localhost:8000/storage/test/ -H "authorization: ${token}" >/dev/null
done
# Create some folders
for _i in {1..100}; do
  curl --silent -X POST "http://localhost:8000/storage/test/$(random)" -H "authorization: ${token}" -H 'content-type: application/json' -H 'accept: application/json, */*;q=0.5' -d '{"action":"CreateFolder"}' >/dev/null
done
# Get the root folder again
for _i in {1..100}; do
  curl --silent -X GET http://localhost:8000/storage/test/ -H "authorization: ${token}" >/dev/null
done

echo
echo "Benchmark end =====> $(date +'%Y-%m-%d-%H-%M-%S-%N')"
echo
echo "Benchmark done!"
kill -- "${server_pid}"

llvm-profdata merge -o /tmp/bulgur-cloud-pgo-data/merged.profdata /tmp/bulgur-cloud-pgo-data

echo
echo "To build the server using the generated profile, build with:"
printf "\tRUSTFLAGS='-Cprofile-use=/tmp/bulgur-cloud-pgo-data/merged.profdata'"
echo
