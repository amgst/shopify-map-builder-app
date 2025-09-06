import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Page - Map App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 2.5em;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .status {
                font-size: 1.2em;
                margin: 20px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
            }
            .success {
                color: #4ade80;
                font-weight: bold;
            }
            .info {
                margin: 10px 0;
                font-size: 1.1em;
            }
            .timestamp {
                font-size: 0.9em;
                opacity: 0.8;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🗺️ Map App Test Page</h1>
            <div class="status">
                <div class="success">✅ Vercel Deployment Working!</div>
            </div>
            <div class="info">
                <p><strong>App Status:</strong> Running Successfully</p>
                <p><strong>Environment:</strong> Vercel Production</p>
                <p><strong>Route:</strong> /test</p>
                <p><strong>Framework:</strong> Remix + React</p>
            </div>
            <div class="status">
                <p>🚀 Your Shopify Map App is deployed and ready!</p>
                <p>📍 Proxy route available at: <code>/proxy</code></p>
            </div>
            <div class="timestamp">
                Generated at: ${new Date().toISOString()}
            </div>
        </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}