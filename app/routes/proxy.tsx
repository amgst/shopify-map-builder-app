import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { useState } from "react";
import { createStorefrontService } from "../utils/storefront.server";
import { validateProxyRequest } from "../utils/proxy-validator.server";

// Shopify App Proxy Route
// This route handles requests from: malihacollections.com/editor/
// Shopify proxies these requests to: your-app-url.com/proxy

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Validate the proxy request from Shopify
  const validation = validateProxyRequest(request);
  
  if (!validation.isValid) {
    throw new Response(`Proxy validation failed: ${validation.error}`, { 
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const shop = validation.shop!;
  const url = new URL(request.url);
  const timestamp = url.searchParams.get('timestamp');

  // Return data needed for the map editor
  return json({
    shop,
    appName: 'Custom Map Builder',
    storeName: shop.replace('.myshopify.com', ''),
    cartUrl: `https://${shop}/cart`,
    timestamp,
    isValidProxy: true
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Validate proxy request for POST actions too
  const validation = validateProxyRequest(request);
  
  if (!validation.isValid) {
    return json({ 
      success: false, 
      error: `Proxy validation failed: ${validation.error}` 
    }, { status: 403 });
  }

  const formData = await request.formData();
  const shop = validation.shop!;
  const mapDataString = formData.get('mapData') as string;
  
  try {
    const mapData = JSON.parse(mapDataString);
    
    // Use Storefront API for real cart integration
    const storefrontService = createStorefrontService(shop);
    
    // Try to create a direct checkout URL
    const checkoutUrl = await storefrontService.createDirectCheckout({
      location: mapData.location,
      style: mapData.style,
      size: mapData.size || 'standard',
      frame: mapData.frame || 'none'
    });
    
    if (checkoutUrl) {
      return json({ 
        success: true, 
        checkoutUrl,
        message: 'Map added to cart successfully!' 
      });
    } else {
      // Fallback to cart URL with attributes
      const cartUrl = `https://${shop}/cart/add?` + new URLSearchParams({
        'attributes[_Map Builder]': 'true',
        'attributes[_Map Location]': mapData.location,
        'attributes[_Map Style]': mapData.style,
        'attributes[_Created At]': new Date().toISOString()
      }).toString();
      
      return json({ 
        success: true, 
        redirectUrl: cartUrl,
        message: 'Redirecting to cart...' 
      });
    }
  } catch (error) {
    console.error('Cart integration error:', error);
    
    // Fallback to simple cart URL
    return json({ 
      success: false, 
      error: 'Unable to add to cart. Please try again.',
      redirectUrl: `https://${shop}/cart` 
    });
  }
};

export default function ProxyMapEditor() {
  const { shop, appName, storeName, cartUrl } = useLoaderData<typeof loader>();
  const [mapLocation, setMapLocation] = useState('');
  const [mapStyle, setMapStyle] = useState('modern');
  const [mapSize, setMapSize] = useState('standard');
  const [mapFrame, setMapFrame] = useState('none');
  const [isBuilding, setIsBuilding] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const handleBuildMap = () => {
    setIsBuilding(true);
    // Simulate map building process
    setTimeout(() => {
      setIsBuilding(false);
    }, 2000);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>{appName}</h1>
        <p style={{ margin: '0', color: '#666' }}>Create custom maps for {storeName}</p>
      </div>

      {/* Map Builder Interface */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: '0', color: '#333' }}>🗺️ Map Builder</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location:</label>
          <input
            type="text"
            value={mapLocation}
            onChange={(e) => setMapLocation(e.target.value)}
            placeholder="Enter address or coordinates..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Map Style:</label>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="modern">Modern</option>
            <option value="vintage">Vintage</option>
            <option value="minimalist">Minimalist</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Map Size:</label>
          <select
            value={mapSize}
            onChange={(e) => setMapSize(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="small">Small (8x10 inches)</option>
            <option value="standard">Standard (12x16 inches)</option>
            <option value="large">Large (18x24 inches)</option>
            <option value="extra-large">Extra Large (24x36 inches)</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Frame Option:</label>
          <select
            value={mapFrame}
            onChange={(e) => setMapFrame(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="none">No Frame</option>
            <option value="black">Black Frame</option>
            <option value="white">White Frame</option>
            <option value="wood">Wood Frame</option>
            <option value="gold">Gold Frame</option>
          </select>
        </div>

        <button
          onClick={handleBuildMap}
          disabled={!mapLocation || isBuilding}
          style={{
            backgroundColor: mapLocation && !isBuilding ? '#007cba' : '#ccc',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: mapLocation && !isBuilding ? 'pointer' : 'not-allowed',
            marginRight: '10px'
          }}
        >
          {isBuilding ? '🔄 Building Map...' : '🎨 Build Map'}
        </button>
      </div>

      {/* Map Preview */}
      {mapLocation && (
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>📍 Map Preview</h3>
          <div style={{
            backgroundColor: '#f0f0f0',
            height: '300px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ccc'
          }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
              <div><strong>Location:</strong> {mapLocation}</div>
              <div><strong>Style:</strong> {mapStyle}</div>
              <div><strong>Size:</strong> {mapSize}</div>
              <div><strong>Frame:</strong> {mapFrame}</div>
              {isBuilding && <div style={{ marginTop: '10px', color: '#007cba' }}>Generating your custom map...</div>}
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Section */}
      {mapLocation && !isBuilding && (
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>🛒 Add to Cart</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Add this custom map to your cart and complete your purchase.
          </p>
          
          {cartMessage && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '4px',
              backgroundColor: cartMessage.includes('success') ? '#d4edda' : '#f8d7da',
              color: cartMessage.includes('success') ? '#155724' : '#721c24',
              border: `1px solid ${cartMessage.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {cartMessage}
            </div>
          )}
          
          <Form 
            method="post" 
            style={{ display: 'inline-block' }}
            onSubmit={() => setCartMessage('Adding to cart...')}
          >
            <input type="hidden" name="mapData" value={JSON.stringify({ 
              location: mapLocation, 
              style: mapStyle, 
              size: mapSize, 
              frame: mapFrame 
            })} />
            
            <button
              type="submit"
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🛒 Add Custom Map to Cart
            </button>
          </Form>
          
          <a
            href={cartUrl}
            target="_parent"
            style={{
              display: 'inline-block',
              backgroundColor: '#007cba',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            🏪 View Cart
          </a>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        padding: '20px',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>Powered by {appName} • Integrated with {storeName}</p>
        <p>🔒 Secure checkout through Shopify</p>
      </div>
    </div>
  );
}

// Add CSS for better mobile responsiveness
export function links() {
  return [
    {
      rel: "stylesheet",
      href: "data:text/css," + encodeURIComponent(`
        @media (max-width: 768px) {
          body { margin: 10px; }
          .container { padding: 15px !important; }
          input, select, button { font-size: 16px !important; }
        }
      `)
    }
  ];
}