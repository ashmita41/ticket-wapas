import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticket Wapas — Citizen Refund Service Prototype",
  description: "An independent public-service prototype for cancelled reserved PRS and unreserved UTS counter-ticket refunds using synthetic data and mocked systems.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
