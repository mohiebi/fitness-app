import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@fitnessos/components/app-shell";
import { requireRole } from "@fitnessos/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: () => requireRole('client'),
  head: () => ({ meta: [{ title: "Client — FitnessOS" }] }),
  component: () => <AppShell variant="client" />,
});
