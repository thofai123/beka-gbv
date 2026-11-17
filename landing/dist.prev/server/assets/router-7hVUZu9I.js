import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const appCss = "/assets/styles-CYVXckTm.css";
const KEY = "beka_cookie_consent_v1";
const POLICY_URL = "/cookies";
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    return null;
  }
}
function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => {
    const c = read();
    if (c) setAnalytics(!!c.analytics);
    else setOpen(true);
    const reopen = () => {
      const s = read();
      setAnalytics(!!(s && s.analytics));
      setOpen(true);
    };
    window.addEventListener("beka:cookie-settings", reopen);
    return () => window.removeEventListener("beka:cookie-settings", reopen);
  }, []);
  function save(allow) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: !!allow, ts: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch (e) {
    }
    setOpen(false);
    if (allow) window.dispatchEvent(new Event("beka:analytics-allowed"));
  }
  if (!open) return null;
  const btn = { flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#1f2937", font: "inherit", fontWeight: 600, cursor: "pointer" };
  const primary = { ...btn, background: "#E84B1D", borderColor: "#E84B1D", color: "#fff" };
  return /* @__PURE__ */ jsxs("div", { role: "dialog", "aria-label": "Cookie settings", style: { position: "fixed", left: 12, right: 12, bottom: 12, maxWidth: 520, margin: "0 auto", background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.25)", padding: 16, zIndex: 99999, fontSize: 14, lineHeight: 1.45 }, children: [
    /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 6px", fontSize: 15, fontWeight: 700 }, children: "Cookies on BEKA" }),
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 12px" }, children: [
      "We use necessary storage to keep you signed in and make the app work.",
      " Optional analytics stay off unless you allow them.",
      " ",
      /* @__PURE__ */ jsx("a", { href: POLICY_URL, style: { color: "#E84B1D", textDecoration: "underline" }, children: "Learn more" })
    ] }),
    /* @__PURE__ */ jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center", margin: "0 0 12px" }, children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", checked: analytics, onChange: (e) => setAnalytics(e.target.checked) }),
      " Analytics (optional)"
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("button", { style: btn, onClick: () => save(false), children: "Necessary only" }),
      /* @__PURE__ */ jsx("button", { style: btn, onClick: () => save(analytics), children: "Save choice" }),
      /* @__PURE__ */ jsx("button", { style: primary, onClick: () => save(true), children: "Accept all" })
    ] }) })
  ] });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$4 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Safe4All — GBV Emergency Response" },
      { name: "description", content: "Safe4All is a secure, multilingual GBV emergency response platform connecting survivors to responders, shelters, and legal aid across Zambia." },
      { name: "author", content: "Safe4All" },
      { property: "og:title", content: "Safe4All — GBV Emergency Response" },
      { property: "og:description", content: "Secure, multilingual GBV emergency response across Zambia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Safe4All — GBV Emergency Response" },
      { name: "twitter:description", content: "Secure, multilingual GBV emergency response across Zambia." },
      { property: "og:image", content: "/app-preview.svg" },
      { name: "twitter:image", content: "/app-preview.svg" }
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
      },
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$4.useRouteContext();
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(CookieConsent, {})
  ] });
}
const $$splitComponentImporter$3 = () => import("./index-DNiNpPT6.js");
const Route$3 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Safe4All — GBV Emergency Response"
    }, {
      name: "description",
      content: "Safe4All is a secure, multilingual GBV emergency response platform connecting survivors to responders, shelters, and legal aid across Zambia."
    }, {
      property: "og:title",
      content: "Safe4All — GBV Emergency Response"
    }, {
      property: "og:description",
      content: "Secure, multilingual GBV emergency response across Zambia."
    }, {
      property: "og:type",
      content: "website"
    }, {
      property: "og:url",
      content: "/"
    }, {
      property: "og:image",
      content: "/app-preview.svg"
    }, {
      name: "twitter:image",
      content: "/app-preview.svg"
    }],
    links: [{
      rel: "canonical",
      href: "/"
    }, {
      rel: "preconnect",
      href: "https://fonts.googleapis.com"
    }, {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: ""
    }, {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Fredoka:wght@400;500;600;700&display=swap"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./cookies-DKBElvEq.js");
const Route$2 = createFileRoute("/cookies")({
  head: () => ({
    meta: [{
      title: "Cookie Policy – BEKA"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./privacy-BzjhA73c.js");
const Route$1 = createFileRoute("/privacy")({
  head: () => ({
    meta: [{
      title: "Privacy Policy – BEKA"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./terms-CbjCV3Oj.js");
const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{
      title: "Terms of Service – BEKA"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$4
});
const CookiesRoute = Route$2.update({
  id: "/cookies",
  path: "/cookies",
  getParentRoute: () => Route$4
});
const PrivacyRoute = Route$1.update({
  id: "/privacy",
  path: "/privacy",
  getParentRoute: () => Route$4
});
const TermsRoute = Route.update({
  id: "/terms",
  path: "/terms",
  getParentRoute: () => Route$4
});
const rootRouteChildren = {
  IndexRoute,
  CookiesRoute,
  PrivacyRoute,
  TermsRoute
};
const routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};
