use std::{fs, path::PathBuf};

fn main() {
    // We really only need this to run once, ever.
    println!("cargo:rerun-if-changed=./Cargo.toml");

    // Create the web-build folder, otherwise the embed will throw an error
    // in CI where the folder may be missing.
    fs::create_dir_all(
        PathBuf::from(".")
            .join("..")
            .join("frontend")
            .join("web-build"),
    )
    .expect("Failed to create web build folder");
}
