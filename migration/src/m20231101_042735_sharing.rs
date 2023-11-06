use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Sharing::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Sharing::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Sharing::Path).string().not_null())
                    .col(ColumnDef::new(Sharing::SharedByUserId).string().not_null())
                    .col(ColumnDef::new(Sharing::SharedWithUserId).string())
                    .col(ColumnDef::new(Sharing::CreatedAt).string().not_null())
                    .col(ColumnDef::new(Sharing::UpdatedAt).string().not_null())
                    .col(ColumnDef::new(Sharing::ExpiresAt).string())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Sharing::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Sharing {
    Table,
    Id,
    Path,
    SharedWithUserId,
    SharedByUserId,
    CreatedAt,
    UpdatedAt,
    ExpiresAt,
}
