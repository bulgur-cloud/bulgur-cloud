//! Unsupported system.
//!
//! We can support it, but it will be unsafe.

#[cfg(not(feature = "allow-unsafe-platforms"))]
compile_error!("This is an unsupported platform. You can enable the feature 'allow-unsafe-platforms' to continue, but your rename operations will no longer be atomic.");

pub fn rename<F: AsRef<Path>, T: AsRef<Path>>(from: F, to: T) {
    std::fs::rename(from, to);
}
