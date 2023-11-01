use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .create_table(
                Table::create()
                    .table(User::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(User::Id).string().not_null().primary_key())
                    .col(ColumnDef::new(User::Username).string().not_null())
                    .col(ColumnDef::new(User::PasswordHash).string().not_null())
                    .col(ColumnDef::new(User::UserType).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(UserToken::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserToken::Token)
                            .string()
                            .primary_key()
                            .not_null(),
                    )
                    .col(ColumnDef::new(UserToken::UserId).string().not_null())
                    .col(ColumnDef::new(UserToken::CreatedAt).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from_tbl(UserToken::Table)
                            .from_col(UserToken::UserId)
                            .to_tbl(User::Table)
                            .to_col(User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(PathToken::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PathToken::Token)
                            .string()
                            .primary_key()
                            .not_null(),
                    )
                    .col(ColumnDef::new(PathToken::Path).string().not_null())
                    .col(ColumnDef::new(PathToken::CreatedAt).string().not_null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserToken::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(PathToken::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(User::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
    Username,
    PasswordHash,
    UserType,
}

#[derive(DeriveIden)]
enum UserToken {
    Table,
    Token,
    UserId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum PathToken {
    Table,
    Token,
    Path,
    CreatedAt,
}
