"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/rice", label: "Backlog" },
  { href: "/rice/submit", label: "Submit" },
  { href: "/rice/leaderboard", label: "Leaderboard" },
]

export default function RiceSubNav() {
  const pathname = usePathname()
  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        borderRadius: 9999,
        padding: 4,
        width: "fit-content",
        background: "var(--atlas-gray-50)",
        border: "1px solid var(--atlas-gray-300)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 9999,
              textDecoration: "none",
              ...(isActive
                ? { background: "var(--atlas-blue-900)", color: "white" }
                : { color: "var(--atlas-gray-900)" }),
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
