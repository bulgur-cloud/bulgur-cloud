import { clsx } from "@/utils/clsx";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { themeSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { IconChevronDown } from "@tabler/icons-react";
import { useMemo } from "react";

const THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
] as const;

export function ThemePicker() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <div
      className={clsx(
        "relative flex flex-row flex-wrap",
        isOpen ? "mb-16" : "h-64 overflow-clip",
      )}
    >
      <button
        onClick={onToggle}
        aria-label="See more themes"
        className={clsx(
          "absolute w-full h-16 bottom-0 bg-gradient-to-t from-black z-10",
          isOpen ? "bottom-[-4rem]" : "bottom-0",
        )}
      >
        <IconChevronDown
          className={clsx(
            "text-white w-12 h-12 mx-auto",
            isOpen && "transform rotate-180",
          )}
        />
      </button>
      {THEMES.map((theme) => (
        <ThemePreviewButton key={theme} theme={theme} />
      ))}
    </div>
  );
}

function ThemePreviewButton({ theme }: { theme: typeof THEMES[number] }) {
  const currentTheme = useAppSelector((state) => state.theme.theme);
  const isCurrentTheme = useMemo(
    () => currentTheme === theme,
    [currentTheme, theme],
  );
  const dispatch = useAppDispatch();

  return (
    <button
      onClick={() => {
        dispatch(themeSlice.actions.setTheme(theme));
      }}
    >
      <div
        data-theme={theme}
        className={`card m-2 w-fit p-1 shadow-xl border-4 ${
          isCurrentTheme ? "border-primary" : "border-transparent"
        }`}
      >
        <div className="card-body flex flex-col">
          <p>{theme}</p>
          <div className="flex flex-row">
            <div className="p-2 ml-1 rounded-box text-sm bg-primary text-primary-content">
              A
            </div>
            <div className="p-2 ml-1 rounded-box text-sm bg-secondary text-secondary-content">
              A
            </div>
            <div className="p-2 ml-1 rounded-box text-sm bg-accent text-accent-content">
              A
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
