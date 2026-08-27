import type { Metadata } from "next";
import RefundStatusClient from "./status-client";

export const metadata: Metadata = {
  title: "Sign in and track refund — Ticket Wapas",
  description: "A simulated citizen account for checking synthetic railway counter-ticket refund requests.",
};

export default function RefundStatusPage() {
  return <RefundStatusClient />;
}
