import { Banner } from "@/components/Banner";
import { Dropdown } from "@/components/Dropdown";
import { useLogout } from "@/hooks/auth";
import { useAppSelector } from "@/utils/store";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback } from "react";

export function Navbar() {
  const username = useAppSelector((state) => state.auth.username);
  const { doLogout } = useLogout();
  const logout = useCallback(() => {
    doLogout({ noRedirect: false });
  }, [doLogout]);

  if (!username) {
    // Logged out users don't get a navbar.
    return null;
  }

  return (
    <>
      <header className="navbar bg-base-100 p-4">
        <Link href="/s" className="select-none text-2xl">
          Bulgur Cloud
        </Link>
        <div className="grow" />
        <Link href={`/s/${username}`}>{username}</Link>
        <div className="grow" />
        <div className="flex-none">
          <Dropdown
            trigger={
              <div className="btn btn-square btn-ghost">
                <IconMenu2 />
              </div>
            }
          >
            <Link
              href="/settings"
              className="btn btn-ghost w-full rounded-none focus:bg-base-200 focus:outline-none"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="btn btn-ghost w-full rounded-none focus:bg-base-200 focus:outline-none"
            >
              Logout
            </button>
          </Dropdown>
          <div className="dropdown dropdown-end"></div>
        </div>
      </header>
      <Banner bannerKey="page" />
    </>
  );
}
