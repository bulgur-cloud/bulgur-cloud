use async_trait::async_trait;

#[async_trait]
pub trait KVDatabase {
    fn name(self: &Self) -> &'static str;
    async fn open(self: &Self, name: &str) -> Box<dyn KVTable>;
}

#[async_trait]
pub trait KVTable {
    fn name(self: &Self) -> &'static str;
    async fn put(self: &mut Self, key: &str, value: &str);
    async fn get(self: &mut Self, key: &str) -> Option<String>;
}

impl std::fmt::Debug for dyn KVDatabase + Sync + Send {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct(self.name()).finish()
    }
}

impl std::fmt::Debug for dyn KVTable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct(self.name()).finish()
    }
}

pub type BKVTable = Box<dyn KVTable>;
