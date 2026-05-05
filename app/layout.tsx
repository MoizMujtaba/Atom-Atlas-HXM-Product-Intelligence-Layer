import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import Nav from "@/components/nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Atom — Atlas HXM Product Intelligence",
  description: "Product signal layer for Atlas HXM",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Nav />
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
