use std::io;
use std::path::Path;
use windows_sys::Win32::Storage::FileSystem::MoveFileExW;

pub fn rename<F: AsRef<Path>, T: AsRef<Path>>(from: F, to: T) -> std::io::Result<()> {
    unsafe {
        if MoveFileExW(from.as_ptr(), to.as_ptr(), flags) == 0 {
            Err(io::Error::last_os_error())
        } else {
            Ok(())
        }
    }
}
