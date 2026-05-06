"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import SyncButton from "@/components/sync-button"
import { useEffect, useState } from "react"

function P1Badge() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    fetch("/api/signals-count")
      .then(r => r.json())
      .then(d => setCount(d.p1Count ?? 0))
      .catch(() => {})
  }, [])
  if (!count) return null
  return (
    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {count > 9 ? "9+" : count}
    </span>
  )
}

const links = [
  { href: "/cycles", label: "Cycles", badge: <P1Badge /> },
  { href: "/sentinel", label: "Sentinel" },
  { href: "/rice", label: "RICE Backlog" },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-gray-900 text-white px-2 py-0.5 rounded tracking-wider">ATOM</span>
          <span className="text-gray-500 text-sm hidden sm:block">Atlas HXM Product Intelligence</span>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded text-sm transition-all duration-150",
                  (l.href === "/cycles" ? pathname.startsWith("/cycles") : pathname === l.href)
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {l.label}
                {l.badge}
              </Link>
            ))}
          </nav>
          <SyncButton />
        </div>
      </div>
    </header>
  )
}
