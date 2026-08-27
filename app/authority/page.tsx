import type { Metadata } from "next";
import AuthorityDashboard from "./authority-dashboard";

export const metadata: Metadata = {
  title: "Authority operations demo — Ticket Wapas",
  description: "A read-only synthetic application queue for the Ticket Wapas prototype.",
};

export default function AuthorityPage() {
  return <AuthorityDashboard />;
}
