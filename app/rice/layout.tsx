import RiceSubNav from "@/components/rice-sub-nav"

export default function RiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atlas-brand" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <RiceSubNav />
      {children}
    </div>
  )
}
