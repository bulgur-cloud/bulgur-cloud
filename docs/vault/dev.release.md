---
id: 3m7z75tf9xgi2vm7uvg60yj
title: Release
desc: ""
updated: 1661836876683
created: 1661637180089
---

The release process is fully automated. To release a new version, use the
`./bump-version.sh` script with what kind of version bump you would like from
`patch`, `minor`, or `major`. For example, `bash ./bump-version.sh minor`.

This script will bump up the version number, then create a commit and a tag for
the release. You must push both of these, use `git push` then `git push --tags`.

The CI system is triggered by the tag. Once the tag is pushed, you should see
the release workflow automatically build, test, and upload the new version. If
the release workflow fails, you should be able to delete the offending tag, push
out the corrections, then push a new tag.
