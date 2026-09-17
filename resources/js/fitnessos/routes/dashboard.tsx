import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@fitnessos/components/app-shell";
import { requireRole } from "@fitnessos/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => requireRole('coach'),
  head: () => ({ meta: [{ title: "Dashboard — FitnessOS" }] }),
  component: () => <AppShell variant="coach" />,
});
