use std::{
    io,
    ops::Deref,
    path::{Path, PathBuf},
};

use actix_files::NamedFile;
use actix_multipart::{Multipart, MultipartError};
use actix_web::{
    delete, get, head,
    http::{self, StatusCode},
    post, put,
    web::{self, ReqData},
    Either, HttpResponse, HttpResponseBuilder,
};
use futures::TryStreamExt;
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use tokio::{fs, io::AsyncWriteExt};
use tracing_unwrap::ResultExt;

use crate::{
    folder,
    state::{AppState, Authorized, PathTokenResponse, Token},
};

#[cfg(feature = "generate_types")]
use typescript_type_def::TypeDef;

#[derive(Debug, derive_more::Display, thiserror::Error)]
pub enum StorageError {
    #[display(fmt = "User is not authorized to view this.")]
    NotAuthorized,
    #[display(fmt = "Missing token, please log in and get a token.")]
    TokenMissing,
    #[display(fmt = "IO error {}", _0)]
    IOError(#[from] std::io::Error),
    #[display(fmt = "File upload error {}", _0)]
    UploadError(#[from] MultipartError),
    #[display(fmt = "Bad path")]
    BadPath,
}

impl Serialize for StorageError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let s = format!("{}", self);
        serializer.serialize_str(&s)
    }
}

impl actix_web::error::ResponseError for StorageError {
    fn status_code(&self) -> http::StatusCode {
        match self {
            StorageError::NotAuthorized => StatusCode::UNAUTHORIZED,
            StorageError::TokenMissing => StatusCode::BAD_REQUEST,
            StorageError::IOError(err) => match err.kind() {
                io::ErrorKind::NotFound => StatusCode::NOT_FOUND,
                io::ErrorKind::AlreadyExists => StatusCode::BAD_REQUEST,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            },
            StorageError::UploadError(_) => StatusCode::BAD_REQUEST,
            StorageError::BadPath => StatusCode::BAD_REQUEST,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status_code()).json(&self)
    }
}

/// Gets the path, but only if the user is authorized for it.
#[tracing::instrument]
pub fn get_authorized_path(
    authorized: &Option<ReqData<Authorized>>,
    store: &str,
    path: Option<&str>,
) -> Result<PathBuf, StorageError> {
    match authorized {
        Some(authorized) => {
            let is_authorized = match authorized.deref() {
                Authorized::User(user) => store.eq(&user.0),
                Authorized::Path => true,
                Authorized::Both(_) => true,
            };
            if is_authorized {
                tracing::debug!("User or path token is authorized");
                let path_base = PathBuf::from(folder::STORAGE).join(store);

                match path {
                    Some(path) => {
                        let path_full = path_base.join(path);
                        // Make sure to avoid someone using ".." to escape their
                        // authorized store. This may be unnecessary in some
                        // cases because actix cleans relative paths when
                        // parsing the URL, but keeping this for safety unless
                        // it becomes a performance bottleneck.
                        let relative_path = pathdiff::diff_paths(path_base, &path_full);
                        match relative_path {
                            Some(relative_path) => {
                                if relative_path.starts_with("../")
                                    || relative_path.eq(&PathBuf::from(""))
                                {
                                    return Ok(path_full);
                                }
                            }
                            None => {}
                        }
                        tracing::info!("Tried to access path {:?}", path);
                        Err(StorageError::NotAuthorized)
                    }
                    None => Ok(path_base),
                }
            } else {
                tracing::debug!("Not authorized");
                Err(StorageError::NotAuthorized)
            }
        }
        None => {
            tracing::debug!("No auth token attached");
            Err(StorageError::NotAuthorized)
        }
    }
}

#[derive(Serialize, Deserialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct FolderResults {
    pub entries: Vec<FolderEntry>,
}

#[derive(Serialize, Deserialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
pub struct FolderEntry {
    pub is_file: bool,
    pub name: String,
    pub size: u64,
}

pub async fn get_storage_internal(
    params: web::Path<(String, String)>,
    authorized: &Option<ReqData<Authorized>>,
) -> Result<Either<NamedFile, web::Json<FolderResults>>, StorageError> {
    let (store, path) = params.as_ref();

    let store_path = get_authorized_path(authorized, store, Some(path))?;
    tracing::debug!("Requested path {}", store_path.to_string_lossy());
    if fs::metadata(&store_path).await?.is_file() {
        tracing::debug!("Path is a file");
        Ok(Either::Left(NamedFile::open_async(store_path).await?))
    } else {
        tracing::debug!("Path is a folder");
        let mut entries = fs::read_dir(store_path).await?;
        let mut folder_contents: Vec<FolderEntry> = vec![];
        while let Some(entry) = entries.next_entry().await? {
            let meta = entry.metadata().await?;
            folder_contents.push(FolderEntry {
                is_file: meta.is_file(),
                name: entry.file_name().to_string_lossy().to_string(),
                size: meta.len(),
            })
        }
        Ok(Either::Right(web::Json(FolderResults {
            entries: folder_contents,
        })))
    }
}

#[tracing::instrument]
#[get("/{store}/{path:.*}")]
pub async fn get_storage(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
) -> Result<Either<NamedFile, web::Json<FolderResults>>, StorageError> {
    get_storage_internal(params, &authorized).await
}

fn empty_ok_response() -> HttpResponse {
    HttpResponse::Ok().finish()
}

#[tracing::instrument]
#[delete("/{store}/{path:.*}")]
async fn delete_storage(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = params.as_ref();

    let store_path = get_authorized_path(&authorized, store, Some(path))?;
    if fs::metadata(&store_path).await?.is_file() {
        tracing::debug!("Deleting file {:?}", store_path);
        fs::remove_file(&store_path).await?;
    } else {
        tracing::debug!("Deleting folder {:?}", store_path);
        fs::remove_dir_all(&store_path).await?;
    }
    Ok(empty_ok_response())
}

#[tracing::instrument]
#[head("/{store}/{path:.*}")]
async fn head_storage(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
) -> HttpResponse {
    let (store, path) = params.as_ref();

    let check = async {
        let store_path = get_authorized_path(&authorized, store, Some(path))?;
        tracing::debug!("Requested path {}", store_path.to_string_lossy());

        let meta = fs::metadata(store_path).await?;
        if meta.is_file() || meta.is_dir() {
            Ok::<(), StorageError>(())
        } else {
            Err(std::io::Error::new(std::io::ErrorKind::NotFound, "").into())
        }
    }
    .await;

    match check {
        Ok(_) => empty_ok_response(),
        Err(StorageError::NotAuthorized) => HttpResponse::Unauthorized().finish(),
        Err(_) => HttpResponse::NotFound().finish(),
    }
}

#[derive(Debug, Serialize)]
pub struct PutStoragePayload {
    pub files_written: u32,
}

#[tracing::instrument(skip(payload))]
#[put("/{store}/{path:.*}")]
async fn put_storage(
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
    mut payload: Multipart,
) -> Result<web::Json<PutStoragePayload>, StorageError> {
    let (store, path) = params.as_ref();
    let store_path = get_authorized_path(&authorized, store, Some(path))?;

    tokio::fs::create_dir(&store_path).await.or_else(|err| {
        tracing::debug!("Error: {:?}", err);
        if err.kind() == std::io::ErrorKind::AlreadyExists {
            // It's fine if the folder already exists
            std::io::Result::Ok(())
        } else {
            tracing::warn!(error = ?err, "Unexpected error when creating a folder during upload");
            std::io::Result::Err(err)
        }
    })?;

    match write_files(&mut payload, &store_path).await {
        Ok(files_written) => Ok(web::Json(PutStoragePayload { files_written })),
        Err(err) => Err(err),
    }
}

/// If there's more than this many files with the same name in the folder, fail the upload.
static MAX_RENAME_ATTEMPTS: u32 = 100;

#[tracing::instrument(skip(payload))]
async fn write_files(payload: &mut Multipart, store_path: &Path) -> Result<u32, StorageError> {
    let mut files_written: u32 = 0;
    while let Some(mut field) = payload.try_next().await? {
        files_written += 1;
        let content_disposition = field.content_disposition();

        let filename = content_disposition
            .get_filename()
            .map_or_else(|| nanoid!(), sanitize_filename::sanitize);
        let basename = PathBuf::from(&filename)
            .file_stem()
            .map(|b| b.to_string_lossy().to_string())
            .unwrap_or_else(|| filename.clone());
        let part_filename = format!(".{filename}.{}.part", nanoid!(8));
        let part_filepath = store_path.join(part_filename);
        tracing::debug!(filename = ?filename, part_filepath = ?part_filepath, "Upload started");

        // First start uploading using a temporary, random file name to make
        // sure it doesn't conflict with any existing files
        let mut file = tokio::fs::File::create(&part_filepath).await?;
        while let Some(chunk) = field.try_next().await? {
            file.write_all(&chunk).await?;
        }

        let mut filepath = store_path.join(&filename);
        let extension = filepath
            .extension()
            .map(|ext| {
                let ext = ext.to_string_lossy();
                format!(".{ext}")
            })
            .unwrap_or_else(|| "".to_string());
        let mut i: u32 = 0;
        loop {
            i += 1;
            // Once the upload is done, try to rename the file to it's real name
            let c_filepath = filepath.clone();
            let c_part_filepath = part_filepath.clone();
            let success = web::block(move || atomic_rename::rename(c_part_filepath, c_filepath))
                .await
                // Very unlikely/unrecoverable
                .unwrap_or_log();
            if let Err(err) = &success {
                if err.kind() == std::io::ErrorKind::AlreadyExists {
                    // If the rename failed because a file with the same name
                    // exists, come up with a new file name
                    filepath.set_file_name(format!("{basename} ({i}){extension}"));
                } else {
                    // If the rename failed for any other reason, the upload
                    // should fail too
                    success?;
                }
            } else {
                // The rename worked, we're done
                break;
            }

            // Avoid too many rename attempts, otherwise this could turn into a
            // DoS vulnerability
            if i == MAX_RENAME_ATTEMPTS {
                // If we're about to hit the max, try a nanoid which is unlikely
                // to hit another conflict
                filepath.set_file_name(format!("{filename} ({}){extension}", nanoid!()));
            }
            if i > MAX_RENAME_ATTEMPTS {
                break;
            }
        }
    }
    Ok(files_written)
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[cfg_attr(feature = "generate_types", derive(TypeDef))]
#[serde(tag = "action")]
pub enum StorageAction {
    MakePathToken,
    Move { new_path: String },
    CreateFolder,
}

#[tracing::instrument]
#[post("/{store}/{path:.*}")]
async fn post_storage(
    state: web::Data<AppState>,
    action: web::Json<StorageAction>,
    params: web::Path<(String, String)>,
    authorized: Option<ReqData<Authorized>>,
) -> Result<HttpResponse, StorageError> {
    let (store, path) = params.as_ref();
    let store_path = get_authorized_path(&authorized, store, Some(path))?;
    match action.deref() {
        StorageAction::MakePathToken => Ok(make_path_token(&state, &store_path).await),
        StorageAction::Move { new_path } => {
            let (to_store, to_path) = parse_store_path(new_path).ok_or(StorageError::BadPath)?;
            let to_store_path = get_authorized_path(&authorized, to_store, Some(&to_path))?;
            fs::rename(store_path, to_store_path).await?;
            Ok(empty_ok_response())
        }
        StorageAction::CreateFolder => {
            tokio::fs::create_dir(&store_path).await?;
            Ok(empty_ok_response())
        }
    }
}

#[tracing::instrument]
async fn make_path_token(state: &web::Data<AppState>, path: &Path) -> HttpResponse {
    let token = Token::new();
    let full_path = format!("/{}", path.to_string_lossy());
    tracing::debug!("Creating a token for {}", full_path);
    let mut path_token_cache = state.path_token_cache.0.write().await;
    path_token_cache.insert(full_path, token.clone());
    drop(path_token_cache);
    HttpResponse::Ok().json(PathTokenResponse { token })
}

#[tracing::instrument]
fn parse_store_path(path: &str) -> Option<(&str, String)> {
    let mut segments = path.split('/').filter(|segment| !segment.is_empty());
    let store = segments.next();
    let rest: Vec<&str> = segments.collect();
    store.map(|store| (store, rest.join("/")))
}
