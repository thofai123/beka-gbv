import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";
import { cookies } from "../lib/legal-content";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy – BEKA" }] }),
  component: () => <LegalPage title="Cookie Policy" html={cookies} />,
});
