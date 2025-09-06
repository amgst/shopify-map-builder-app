import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Minimal Shopify App (No Polaris)</h1>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/app" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/app/settings" style={{ marginRight: "10px" }}>Settings</Link>
        <Link to="/app/orders" style={{ marginRight: "10px" }}>Map Orders</Link>
        <Link to="/health" style={{ marginRight: "10px" }}>Health Check</Link>
      </nav>
      <div style={{ border: "1px solid #ccc", padding: "10px" }}>
        <Outlet />
      </div>
      <p style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        API Key: {apiKey ? "✓ Configured" : "✗ Missing"}
      </p>
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};