import type { Metadata } from "next";
import RefundStatusClient from "./status-client";

export const metadata: Metadata = {
  title: "Sign in and track refund — Ticket Wapas",
  description: "A citizen account for checking railway counter-ticket refund requests and payment status.",
};

export default function RefundStatusPage() {
  return <RefundStatusClient />;
}
