Atomically rename files, ensuring that concurrent rename operations won't
overwrite an existing file.

Uses code from the [tempfile](https://crates.io/crates/tempfile) crate for the
atomic rename operation. Check that crate if you need more comprehensive support
for temporary files. This crate isolates the rename function and allows you to
use the atomic rename for all files.
