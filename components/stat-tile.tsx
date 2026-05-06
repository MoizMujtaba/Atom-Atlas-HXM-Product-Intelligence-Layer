export default function StatTile({
  label,
  value,
  accent,
  caption,
  dark,
}: {
  label: string
  value: string | number
  accent: string
  caption?: string
  dark?: boolean
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 shadow-sm border"
      style={{
        background: dark ? "var(--atlas-blue-900)" : "white",
        borderColor: dark ? "var(--atlas-blue-900)" : "var(--atlas-gray-300)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-3 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: dark ? "var(--atlas-blue-250)" : "var(--atlas-gray-900)", opacity: dark ? 1 : 0.6 }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-3xl font-extrabold mt-2 tracking-tight"
        style={{ color: dark ? "white" : "var(--atlas-gray-900)" }}
      >
        {value}
      </p>
      {caption && (
        <p
          className="text-[11px] mt-1"
          style={{ color: dark ? "var(--atlas-blue-250)" : "var(--atlas-gray-900)", opacity: dark ? 1 : 0.55 }}
        >
          {caption}
        </p>
      )}
    </div>
  )
}
