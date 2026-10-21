import Image from "next/image";
import Link from "next/link";
import { primaryNav } from "@/lib/pages";
import { site } from "@/lib/site";
import { HeaderNav } from "./HeaderNav";

export function Header() {
  return (
    <header className="border-b-2 border-amber-400 bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 rounded text-lg font-bold tracking-tight text-white">
          <Image
            src={site.logo.path}
            alt=""
            width={40}
            height={40}
            loading="eager"
            className="h-10 w-10 rounded-lg ring-2 ring-amber-400/70"
          />
          <span>{site.name}</span>
        </Link>
        <HeaderNav links={primaryNav()} />
      </div>
    </header>
  );
}
