"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/brief", label: "Weekly Brief" },
  { href: "/signals", label: "Signals" },
  { href: "/cycles", label: "Cycles" },
  { href: "/rice", label: "RICE Backlog" },
  { href: "/compete", label: "Compete" },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded">ATOM</span>
          <span className="text-gray-400 text-sm">Atlas HXM Product Intelligence</span>
        </div>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded text-sm transition-colors",
                pathname === l.href
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
