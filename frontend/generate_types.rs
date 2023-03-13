//! Run this binary to re-generate the `api.d.ts` file.
//! If new types are added for the API, import them here and add to ApiTypes.
//!
//! Make sure to run this inside `bulgur-cloud-frontend` folder.
use std::{env, fs, path::PathBuf};

use bulgur_cloud::{
    auth::{Login, LoginResponse},
    state::PathTokenResponse,
    storage::{FileMeta, FolderResults, PutStoragePayload, StorageAction},
};
use typescript_type_def::{write_definition_file, DefinitionFileOptions};

type ApiTypes = (
    Login,
    LoginResponse,
    FolderResults,
    PathTokenResponse,
    StorageAction,
    PutStoragePayload,
    FileMeta,
);

fn main() {
    let mut buf = Vec::new();
    let options = DefinitionFileOptions {
        header: Some("// Auto-generated from backend types, do not edit by hand"),
        root_namespace: Some("api"),
    };
    write_definition_file::<_, ApiTypes>(&mut buf, options).unwrap();
    let out = String::from_utf8(buf).unwrap();
    if !env::current_dir()
        .unwrap()
        .ends_with("bulgur-cloud-frontend")
    {
        env::set_current_dir("bulgur-cloud-frontend").unwrap();
    }
    env::set_current_dir("src").unwrap();
    fs::write(PathBuf::from("api.d.ts"), &out).unwrap();
    print!("{}", out);
}
