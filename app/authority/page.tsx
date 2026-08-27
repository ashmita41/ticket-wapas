import type { Metadata } from "next";
import AuthorityDashboard from "./authority-dashboard";

export const metadata: Metadata = {
  title: "Refund operations — Ticket Wapas",
  description: "An application queue for reviewing counter-ticket refund requests and payment status.",
};

export default function AuthorityPage() {
  return <AuthorityDashboard />;
}
