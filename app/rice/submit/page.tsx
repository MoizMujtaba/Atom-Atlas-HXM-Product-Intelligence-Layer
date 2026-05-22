import RiceSubmitForm from "@/components/rice-submit-form"

export default function RiceSubmitPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 12,
          background: "var(--atlas-gray-50)",
          border: "1px solid var(--atlas-gray-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-gray-900)", opacity: 0.5, margin: 0 }}>
            ATLAS HXM · RICE SUBMIT
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--atlas-gray-900)", margin: "4px 0 0" }}>
            Submit a hypothesis
          </h1>
          <p style={{ fontSize: 13, color: "var(--atlas-gray-900)", opacity: 0.6, margin: "4px 0 0" }}>
            Answer business questions. We calculate the RICE score automatically.
          </p>
        </div>
        <div style={{ fontSize: 12, color: "var(--atlas-gray-900)", opacity: 0.5 }}>
          Share this form:{" "}
          <span style={{ fontWeight: 600, opacity: 1 }}>https://atom-atlas-hxm-product-intelligence.vercel.app/rice/submit</span>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--atlas-gray-300)",
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            background: "var(--atlas-gray-50)",
            borderBottom: "1px solid var(--atlas-gray-300)",
          }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--atlas-gray-900)", margin: 0 }}>
            New Hypothesis
          </h2>
        </div>
        <div style={{ padding: 20, background: "white" }}>
          <RiceSubmitForm />
        </div>
      </div>
    </div>
  )
}
