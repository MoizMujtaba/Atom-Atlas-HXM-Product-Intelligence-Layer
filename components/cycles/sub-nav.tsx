"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
    <span
      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold leading-none"
      style={{ background: "var(--atlas-coral-500)" }}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}

const TABS = [
  { href: "/cycles", label: "Delivery" },
  { href: "/cycles/signals", label: "Signals", badge: <P1Badge /> },
  { href: "/cycles/compete", label: "Compete" },
]

export default function CyclesSubNav() {
  const pathname = usePathname()
  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-full p-1 w-fit"
      style={{ background: "var(--atlas-gray-50)", border: "1px solid var(--atlas-gray-300)" }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
            style={isActive ? { background: "var(--atlas-blue-900)", color: "white" } : { color: "var(--atlas-gray-900)" }}
          >
            {tab.label}{tab.badge}
          </Link>
        )
      })}
    </nav>
  )
}
