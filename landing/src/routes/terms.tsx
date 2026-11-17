import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";
import { terms } from "../lib/legal-content";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service – BEKA" }] }),
  component: () => <LegalPage title="Terms of Service" html={terms} />,
});
