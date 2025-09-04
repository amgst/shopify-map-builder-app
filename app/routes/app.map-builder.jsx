import { useState, useRef, useEffect } from "react";
import { json } from "@remix-run/node";
import { Page, Layout, Card, Button } from "@shopify/polaris";

// OpenLayers specific imports
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css'; // OpenLayers CSS

// Your custom styles remain the same
import mapBuilderStyles from "../styles/map-builder.css";

// This links the required OpenLayers CSS file
export const links = () => [
  { rel: "stylesheet", href: mapBuilderStyles },
];

// We no longer need to pass a token from the server
export const loader = async () => {
  return json({});
};

export default function MapBuilderPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-74.006);
  const [lat] = useState(40.7128);
  const [zoom] = useState(12);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once

    // Initialize the OpenLayers map
    map.current = new Map({
      target: mapContainer.current, // The div element for the map
      layers: [
        new TileLayer({
          source: new OSM(), // Using OpenStreetMap as the base layer
        }),
      ],
      view: new View({
        // OpenLayers requires coordinates to be projected.
        // fromLonLat converts standard longitude/latitude to the map's projection.
        center: fromLonLat([lng, lat]),
        zoom: zoom,
      }),
    });
    
  }, [lat, lng, zoom]);


  const handleCaptureMap = () => {
    if (!map.current) return;

    // OpenLayers capture process is different; we listen for a render event
    map.current.once('postrender', function () {
      const mapCanvas = map.current.getViewport().querySelector('canvas');
      if (mapCanvas) {
        const dataURL = mapCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataURL);
      }
    });

    // Trigger a re-render of the map to ensure the 'postrender' event fires
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
            <div className="controls-panel">
               <Button onClick={handleCaptureMap} primary>
                Capture Map View
              </Button>
            </div>
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