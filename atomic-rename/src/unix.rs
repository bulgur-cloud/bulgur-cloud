use libc::{c_char, c_int, link, unlink};
use std::ffi::CString;
use std::io;
use std::os::unix::ffi::OsStrExt;
use std::path::Path;

#[inline(always)]
pub fn cvt_err(result: c_int) -> io::Result<c_int> {
    if result == -1 {
        Err(io::Error::last_os_error())
    } else {
        Ok(result)
    }
}

// Stolen from std.
pub fn cstr(path: &Path) -> io::Result<CString> {
    CString::new(path.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "path contained a null"))
}

pub fn rename<F: AsRef<Path>, T: AsRef<Path>>(from: F, to: T) -> std::io::Result<()> {
    unsafe {
        let old_path = cstr(from.as_ref())?;
        let new_path = cstr(to.as_ref())?;
        cvt_err(link(
            old_path.as_ptr() as *const c_char,
            new_path.as_ptr() as *const c_char,
        ))?;
        // Ignore unlink errors. Can we do better?
        // On recent linux, we can use renameat2 to do this atomically.
        let _ = unlink(old_path.as_ptr() as *const c_char);
        Ok(())
    }
}
