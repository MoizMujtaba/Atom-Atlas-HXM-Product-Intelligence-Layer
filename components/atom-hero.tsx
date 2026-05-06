import type { ReactNode } from "react"

export default function AtomHero({
  pill,
  date,
  headline,
  subline,
  stats,
}: {
  pill: string
  date?: string
  headline: string
  subline?: string
  stats?: ReactNode
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, var(--atlas-blue-900) 0%, var(--atlas-purple-900) 60%, var(--atlas-magenta-900) 100%)",
      }}
    >
      <div className="px-6 py-7 sm:px-8 sm:py-9 text-white">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.16)", color: "white" }}
              >
                {pill}
              </span>
              {date && (
                <span className="text-[12px]" style={{ color: "var(--atlas-blue-250)" }}>
                  {date}
                </span>
              )}
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-bold mt-4 leading-tight tracking-tight">
              {headline}
            </h1>
            {subline && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--atlas-blue-250)" }}>
                {subline}
              </p>
            )}
          </div>
          {stats && (
            <div
              className="rounded-xl px-4 py-4 shrink-0 backdrop-blur"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {stats}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
