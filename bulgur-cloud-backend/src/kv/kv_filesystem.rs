use std::{env, path::PathBuf};
use tokio::{fs, io::AsyncWriteExt};

use async_trait::async_trait;
use tracing_unwrap::ResultExt;

use super::kv::{KVDatabase, KVTable};

pub struct KVFilesystem {
    folder: PathBuf,
}

impl KVFilesystem {
    pub async fn new(base_folder: PathBuf) -> KVFilesystem {
        let mut folder = base_folder;
        if !folder.is_absolute() {
            folder = env::current_dir().unwrap_or_log().join(folder);
        }
        fs::create_dir_all(&folder).await.unwrap_or_log();
        KVFilesystem { folder }
    }
}

#[async_trait]
impl KVDatabase for KVFilesystem {
    fn name(self: &Self) -> &'static str {
        "KVFIlesystem"
    }

    async fn open(self: &Self, name: &str) -> Box<dyn KVTable> {
        let folder = self.folder.join(name);
        fs::create_dir_all(&folder).await.unwrap_or_log();
        Box::new(KVFilesystem { folder })
    }
}

#[async_trait]
impl KVTable for KVFilesystem {
    fn name(self: &Self) -> &'static str {
        "KVTable"
    }

    async fn put(self: &mut Self, key: &str, value: &str) {
        let path = self.folder.join(key);
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(path)
            .await
            .unwrap_or_log();
        file.write_all(value.as_bytes()).await.unwrap_or_log();
    }

    async fn get(self: &mut Self, key: &str) -> Option<String> {
        let path = self.folder.join(key);
        match tokio::fs::read_to_string(path).await {
            Ok(out) => Some(out),
            Err(_) => None,
        }
    }
}
