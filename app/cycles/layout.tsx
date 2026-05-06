import CyclesSubNav from "@/components/cycles/sub-nav"

export default function CyclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atlas-brand space-y-8">
      <CyclesSubNav />
      {children}
    </div>
  )
}
