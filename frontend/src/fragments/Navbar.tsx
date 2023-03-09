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

  return (
    <header className="navbar bg-base-100 p-4">
      <div className="ml-4 select-none">Bulgur Cloud</div>
      <div className="grow" />
      <div>{username}</div>
      <div className="grow" />
      <div className="flex-none">
        <Dropdown
          trigger={
            <button className="btn btn-square btn-ghost">
              <IconMenu2 />
            </button>
          }
        >
          <Link href="/settings" className="btn btn-ghost w-full">
            Settings
          </Link>
          <button onClick={logout} className="btn btn-ghost w-full">
            Logout
          </button>
        </Dropdown>
        <div className="dropdown dropdown-end"></div>
      </div>
    </header>
  );
}
