import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";
import { privacy } from "../lib/legal-content";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy – BEKA" }] }),
  component: () => <LegalPage title="Privacy Policy" html={privacy} />,
});
