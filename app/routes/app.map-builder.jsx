import { useState, useRef, useEffect } from "react";
import { json } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Page, Layout, Card, Button, Select, TextField, ButtonGroup, Text } from "@shopify/polaris";
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
  const productType = formData.get("productType");
  const customText = formData.get("customText");

  console.log("Map Builder Order Data:", {
    productType,
    customText,
    imageSize: capturedImage?.length
  });

  return json({ success: true });
};

const PRODUCT_TYPES = [
  { label: 'Standard Rectangle (2.62:1)', value: 'standard', aspectRatio: 2.62 },
  { label: 'Stick (Small Rectangle)', value: 'stick', aspectRatio: 2.62 },
  { label: 'Twig (Thin Rectangle)', value: 'twig', aspectRatio: 4.0 },
  { label: 'Circle (Ornament)', value: 'circle', aspectRatio: 1.0 },
];

const ORIENTATIONS = [
  { label: 'Landscape', value: 'landscape' },
  { label: 'Portrait', value: 'portrait' },
];

export default function MapBuilderPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-74.006);
  const [lat, setLat] = useState(40.7128);
  const [zoom, setZoom] = useState(12);
  const [capturedImage, setCapturedImage] = useState(null);
  const [productType, setProductType] = useState('standard');
  const [orientation, setOrientation] = useState('landscape');
  const [customText, setCustomText] = useState('');
  const [showCompass, setShowCompass] = useState(false);
  const imageInputRef = useRef(null);

  const selectedProduct = PRODUCT_TYPES.find(p => p.value === productType);
  const aspectRatio = orientation === 'portrait' ? 1 / selectedProduct.aspectRatio : selectedProduct.aspectRatio;

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
        const dataURL = mapCanvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(dataURL);
        if(imageInputRef.current) {
          imageInputRef.current.value = dataURL;
        }
      }
    });
    map.current.renderSync();
  };

  const handleZoomIn = () => {
    if (map.current) {
      const view = map.current.getView();
      view.setZoom(view.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      const view = map.current.getView();
      view.setZoom(view.getZoom() - 1);
    }
  };

  return (
    <Page title="Custom Map Builder">
      <Layout>
        <Layout.Section oneThird>
          <Card title="Product Configuration">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Select
                label="Product Type"
                options={PRODUCT_TYPES}
                value={productType}
                onChange={setProductType}
              />
              <Select
                label="Orientation"
                options={ORIENTATIONS}
                value={orientation}
                onChange={setOrientation}
              />
              <TextField
                label="Custom Text"
                value={customText}
                onChange={setCustomText}
                placeholder="Enter text for your map"
                multiline={2}
              />
              <Button
                pressed={showCompass}
                onClick={() => setShowCompass(!showCompass)}
              >
                {showCompass ? 'Remove' : 'Add'} Compass
              </Button>
            </div>
          </Card>

          <Card title="Map Controls">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ButtonGroup segmented>
                <Button onClick={handleZoomIn}>Zoom In</Button>
                <Button onClick={handleZoomOut}>Zoom Out</Button>
              </ButtonGroup>
              <Button onClick={handleCaptureMap} primary size="large">
                Capture Map for Engraving
              </Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div className="map-builder-container">
              <Text variant="headingMd" as="h2">
                Design Your Map - {selectedProduct.label} ({orientation})
              </Text>
              <div 
                className={`map-wrapper ${productType} ${orientation}`}
                style={{
                  paddingTop: `${(1 / aspectRatio) * 100}%`
                }}
              >
                <div ref={mapContainer} className="map-container engraving-preview" />
                {customText && (
                  <div className="text-overlay">
                    {customText}
                  </div>
                )}
                {showCompass && (
                  <div className="compass-overlay">
                    ⧉
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {capturedImage && (
          <Layout.Section>
            <Card title="Engraving Preview">
              <Form method="post">
                <input type="hidden" name="capturedImage" ref={imageInputRef} />
                <input type="hidden" name="productType" value={productType} />
                <input type="hidden" name="customText" value={customText} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="preview-container">
                    <img src={capturedImage} alt="Map Preview" className="preview-image engraving-style"/>
                    <div className="wood-background"></div>
                  </div>
                  <Button submit primary size="large">
                    Add to Cart - Ready for Engraving
                  </Button>
                </div>
              </Form>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}