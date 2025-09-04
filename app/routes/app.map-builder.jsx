import { useState, useRef, useEffect } from "react";
import { json } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Page, Layout, Card, Button } from "@shopify/polaris";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';

// This is the line we are fixing.
// We import the CSS file directly and give it a special "?url" suffix.
import mapBuilderStyles from "../styles/map-builder.css?url";

// The links function now works correctly with the direct URL import.
export const links = () => [
  { rel: "stylesheet", href: mapBuilderStyles },
];

// We no longer need the loader, it can be removed or left empty
export const loader = async () => json({});

// The action function remains the same
export const action = async ({ request }) => {
  const formData = await request.formData();
  const capturedImage = formData.get("capturedImage");

  console.log("===================================");
  console.log("Received Captured Image on Server!");
  console.log(capturedImage.substring(0, 50) + "...");
  console.log("===================================");

  return json({ success: true });
};

export default function MapBuilderPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-74.006);
  const [lat] = useState(40.7128);
  const [zoom] = useState(12);
  const [capturedImage, setCapturedImage] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
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
            <Form method="post" className="controls-panel">
              <Button onClick={handleCaptureMap} primary>
                Capture Map View
              </Button>
              <input type="hidden" name="capturedImage" ref={imageInputRef} />
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