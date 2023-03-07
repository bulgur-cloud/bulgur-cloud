import Link from "next/link";
import { useCallback, useMemo, useRef } from "react";
import { useCurrentPath } from "./CurrentPathProvider";

type BreadcrumbParts = {
  url: string;
  name: string;
};

export function PathBreadcrumbs() {
  const { fullPath } = useCurrentPath();
  const breadcrumbs = useRef<HTMLDivElement>(null);
  const accumulativePath = useMemo(() => {
    const result: BreadcrumbParts[] = [];
    fullPath.split("/").map((part, index) => {
      const url = index === 0 ? part : `${result[index - 1].url}/${part}`;
      result.push({ url, name: part });
    });
    return result;
  }, [fullPath]);

  const scrollToElement = useCallback(
    (node: HTMLSpanElement | null) => {
      breadcrumbs.current?.scroll({
        left: node?.offsetLeft,
      });
    },
    [breadcrumbs],
  );

  return (
    <div ref={breadcrumbs} className="text-sm breadcrumbs">
      <ul>
        {accumulativePath.map(({ url, name }, index) => (
          <li key={index}>
            {index === accumulativePath.length - 1 ? (
              <span ref={scrollToElement} className="cursor-default mr-2">
                {name}
              </span>
            ) : (
              <Link href={url}>{name}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
