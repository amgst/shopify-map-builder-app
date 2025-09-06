import { json } from "@remix-run/node";

export async function loader() {
  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Vercel deployment test - no Shopify components"
  });
}

export default function Health() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Health Check</h1>
      <p>If you can see this page, the Vercel deployment is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}