"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/sentinel", label: "Insights" },
  { href: "/sentinel/sources", label: "Source Directory" },
  { href: "/sentinel/architecture", label: "Architecture" },
]

export default function SentinelSubNav() {
  const pathname = usePathname()
  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-full p-1 w-fit"
      style={{
        background: "var(--atlas-gray-50)",
        border: "1px solid var(--atlas-gray-300)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || (tab.href === "/sentinel/sources" && pathname.startsWith("/sentinel/sources"))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
            style={
              isActive
                ? {
                    background: "var(--atlas-blue-900)",
                    color: "white",
                  }
                : {
                    color: "var(--atlas-gray-900)",
                  }
            }
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
