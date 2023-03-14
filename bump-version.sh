#!/bin/bash
shopt -s extglob
# Trap errors and interrupts
set -Eeuo pipefail
function handle_sigint() {
  echo "SIGINT, exiting..."
  exit 3
}
trap handle_sigint SIGINT
function handle_err() {
  echo "Error in run.sh!" 1>&2
  echo "$(caller): ${BASH_COMMAND}" 1>&2
  echo "Exiting..."
  exit 2
}
trap handle_err ERR

function usage() {
  echo "Usage: ${0} <patch|minor|major>"
}

# Go to the root of the project
SCRIPT=$(realpath "${0}")
SCRIPTPATH=$(dirname "${SCRIPT}")
cd "${SCRIPTPATH}" || exit 12

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

OLD_VERSION=$(sed -nr 's/^version *= *"([0-9.]+)"/\1/p' bulgur-cloud-backend/Cargo.toml)

case "${1}" in
patch)
  NEW_VERSION=$(echo "${OLD_VERSION}" | python3 -c '[major, minor, patch] = input().split("."); print(f"{major}.{minor}.{int(patch) + 1}")')
  ;;
minor)
  NEW_VERSION=$(echo ${OLD_VERSION} | python3 -c '[major, minor, patch] = input().split("."); print(f"{major}.{int(minor) + 1}.0")')
  ;;
major)
  NEW_VERSION=$(echo ${OLD_VERSION} | python3 -c '[major, minor, patch] = input().split("."); print(f"{int(major) + 1}.0.0")')
  ;;
*)
  usage
  exit 1
  ;;
esac

echo "Bumping up to ${NEW_VERSION}"

sed -i -E "s/^version *= *\"([0-9.]+)\"/version = \"${NEW_VERSION}\"/" bulgur-cloud-backend/Cargo.toml
sed -i -E "s/^version *= *\"([0-9.]+)\"/version = \"${NEW_VERSION}\"/" frontend/Cargo.toml
sed -i -E "s/^( *\"version\" *: *)\"([0-9.]+)\"/\1\"${NEW_VERSION}\"/" frontend/package.json

git add bulgur-cloud-backend/Cargo.toml frontend/Cargo.toml frontend/package.json
git commit -m "version bump ${NEW_VERSION}"
git tag -m "${NEW_VERSION}" "release/${NEW_VERSION}"
