import { useState, useRef, useEffect } from "react";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react"; // <-- Import Form
import { Page, Layout, Card, Button } from "@shopify/polaris";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import mapBuilderStyles from "../styles/map-builder.css";

export const links = () => [ { rel: "stylesheet", href: mapBuilderStyles } ];
export const loader = async () => json({});

// =================================================================
//  NEW: ACTION FUNCTION
//  This function runs ONLY on the server when the form is submitted.
// =================================================================
export const action = async ({ request }) => {
  const formData = await request.formData();
  const capturedImage = formData.get("capturedImage");

  console.log("===================================");
  console.log("Received Captured Image on Server!");
  // We are just logging the first 50 characters to keep the terminal clean
  console.log(capturedImage.substring(0, 50) + "..."); 
  console.log("===================================");

  // In the future, you would save this data or upload it to a file storage.
  // For now, we just prove it arrived.
  return json({ success: true });
};

export default function MapBuilderPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-74.006);
  const [lat] = useState(40.7128);
  const [zoom] = useState(12);
  const [capturedImage, setCapturedImage] = useState(null);
  const imageInputRef = useRef(null); // <-- Ref for our hidden input

  useEffect(() => {
    // ... (map initialization code is the same, no changes here)
    if (map.current || !mapContainer.current) return;
    map.current = new Map({
      target: mapContainer.current,
      layers: [ new TileLayer({ source: new OSM() }) ],
      view: new View({ center: fromLonLat([lng, lat]), zoom: zoom }),
    });
  }, [lat, lng, zoom]);

  const handleCaptureMap = () => {
    if (!map.current) return;
    map.current.once('postrender', function () {
      const mapCanvas = map.current.getViewport().querySelector('canvas');
      if (mapCanvas) {
        const dataURL = mapCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataURL);
        // NEW: Put the image data into our hidden form input
        if(imageInputRef.current) {
          imageInputRef.current.value = dataURL;
        }
      }
    });
    map.current.renderSync();
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <div className="map-wrapper">
              <div ref={mapContainer} className="map-container" />
            </div>
            {/* The controls are now inside a Remix Form */}
            <Form method="post" className="controls-panel">
              <Button onClick={handleCaptureMap} primary>
                Capture Map View
              </Button>
              
              {/* This input is hidden, but holds our image data */}
              <input type="hidden" name="capturedImage" ref={imageInputRef} />

              {/* Only show the "Save" button after an image is captured */}
              {capturedImage && (
                <div style={{ marginTop: '10px' }}>
                  <Button submit primary>
                    Save Customization
                  </Button>
                </div>
              )}
            </Form>
          </Card>
        </Layout.Section>
        {capturedImage && (
          <Layout.Section>
            <Card>
                <h2>Captured Image Preview:</h2>
                <img src={capturedImage} alt="Captured Map" className="preview-image"/>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}