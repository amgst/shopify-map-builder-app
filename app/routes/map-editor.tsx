import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // No authentication required - standalone route
  return json({ message: "Hello World from Map Editor!" });
};

export default function MapEditor() {
  const { message } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#2563eb", marginBottom: "1rem" }}>{message}</h1>
      <p style={{ marginBottom: "2rem", color: "#6b7280" }}>
        This is a standalone map editor route accessible at /map-editor
      </p>
      
      <div style={{ 
        border: "2px dashed #d1d5db", 
        padding: "2rem", 
        borderRadius: "8px",
        backgroundColor: "#f9fafb",
        textAlign: "center" as const
      }}>
        <h2 style={{ color: "#374151", marginBottom: "1rem" }}>Map Editor Placeholder</h2>
        <p style={{ color: "#6b7280" }}>Future map interface will be implemented here</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ color: "#374151", marginBottom: "1rem" }}>Shopify Integration Demo</h3>
        <div style={{ 
          backgroundColor: "#f0f9ff", 
          padding: "1.5rem", 
          borderRadius: "8px",
          border: "1px solid #0ea5e9",
          marginBottom: "1rem"
        }}>
          <p style={{ margin: "0 0 1rem 0", color: "#0c4a6e" }}>
            <strong>Store:</strong> malihacollections.myshopify.com
          </p>
          <p style={{ margin: "0 0 1rem 0", color: "#0c4a6e" }}>
            <strong>Access URL:</strong> https://malihacollections.com/map-editor
          </p>
          <p style={{ margin: "0", color: "#0c4a6e" }}>
            <strong>Integration:</strong> Cart API with custom product properties
          </p>
        </div>
        
        <button 
          style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
            marginRight: "1rem"
          }}
          onClick={() => {
            const cartUrl = `https://malihacollections.myshopify.com/cart/add?id=PRODUCT_ID&properties[map_data]=custom_map_coordinates&properties[map_type]=rectangle&quantity=1`;
            alert(`Cart integration demo:\n\nThis would redirect to:\n${cartUrl}\n\nThe custom map data would be passed as cart properties to your Shopify product.`);
          }}
        >
          Add Custom Map to Cart
        </button>
        
        <button 
          style={{
            backgroundColor: "#6366f1",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
          onClick={() => {
            window.open('https://malihacollections.myshopify.com/', '_blank');
          }}
        >
          Visit Store
        </button>
      </div>
    </div>
  );
}