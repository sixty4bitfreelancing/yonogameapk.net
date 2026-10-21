"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { NavLink } from "@/lib/pages";

function NavItems({ links, pathname, mobile }: { links: NavLink[]; pathname: string; mobile?: boolean }) {
  return (
    <ul className={mobile ? "flex flex-col py-1" : "flex items-center gap-1"}>
      {links.map((link) => {
        const current = link.href === pathname;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={current ? "page" : undefined}
              className={
                mobile
                  ? "block px-4 py-3 text-base " +
                    (current ? "bg-emerald-50 font-semibold text-emerald-800" : "text-gray-800 hover:bg-gray-50")
                  : "rounded-full px-3 py-1.5 text-sm " +
                    (current ? "bg-amber-400 font-semibold text-emerald-950" : "text-emerald-50 hover:bg-white/10 hover:text-white")
              }
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HeaderNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  function onKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape" && menuRef.current?.open) {
      menuRef.current.removeAttribute("open");
      menuRef.current.querySelector("summary")?.focus();
    }
  }

  return (
    <>
      <nav aria-label="Main" className="hidden lg:block">
        <NavItems links={links} pathname={pathname} />
      </nav>
      <details ref={menuRef} onKeyDown={onKeyDown} className="relative lg:hidden">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" focusable="false">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Menu
        </summary>
        <nav
          aria-label="Main"
          className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <NavItems links={links} pathname={pathname} mobile />
        </nav>
      </details>
    </>
  );
}
