//! Uses code from the [tempfile](https://github.com/Stebalien/tempfile) crate.
//! This crate isolates the atomic rename operation from tempfile so it can be
//! used on other files.
//!

cfg_if::cfg_if! {
  if #[cfg(unix)] {
      mod unix;
      pub use self::unix::*;
  } else if #[cfg(windows)] {
      mod windows;
      pub use self::windows::*;
  } else {
      mod other;
      pub use self::other::*;
  }
}
