use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectionTrait, Database, DatabaseConnection};

pub async fn get_db(database_url: &str) -> anyhow::Result<DatabaseConnection> {
    let db: DatabaseConnection = Database::connect(database_url).await?;
    Migrator::up(&db, None).await?;

    if db
        .get_database_backend()
        .eq(&sea_orm::DatabaseBackend::Sqlite)
    {
        // synchronous=NORMAL reduces how often Sqlite flushes to disk,
        // journal_mode=WAL is required to prevent corruption in this mode.
        db.execute_unprepared("PRAGMA journal_mode=WAL;").await?;
        db.execute_unprepared("PRAGMA synchronous=NORMAL;").await?;
    }

    Ok(db)
}
