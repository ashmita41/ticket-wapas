import type { Metadata } from "next";
import TicketWapas from "./ticket-wapas";

export const metadata: Metadata = {
  title: "Ticket Wapas — Counter-ticket refunds, without the return trip",
  description:
    "A proof-first prototype for remote refunds when a railway counter-ticket journey is cancelled.",
  openGraph: {
    title: "Ticket Wapas",
    description: "The train was cancelled. Your refund journey should be too.",
    images: [{ url: "/og-ticket-wapas.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wapas",
    description: "Counter-ticket refunds, without the return trip.",
    images: ["/og-ticket-wapas.png"],
  },
};

export default function Home() {
  return <TicketWapas />;
}
