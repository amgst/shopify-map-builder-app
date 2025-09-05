import { useState } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Button, TextField, Select, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // Load current settings (you can store these in database later)
  const settings = {
    defaultMapSize: "standard",
    maxFileSize: "30",
    minFileSize: "8",
    defaultZoom: "12",
    allowedAspectRatios: ["2.62:1", "4.0:1", "1.0:1"],
    maxCustomElements: "10"
  };

  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  const settings = {
    defaultMapSize: formData.get("defaultMapSize"),
    maxFileSize: formData.get("maxFileSize"),
    minFileSize: formData.get("minFileSize"),
    defaultZoom: formData.get("defaultZoom"),
    maxCustomElements: formData.get("maxCustomElements")
  };

  // Here you would save to database
  console.log("Saving map builder settings:", settings);

  return json({ success: true, message: "Settings saved successfully!" });
};

const MAP_SIZE_OPTIONS = [
  { label: 'Standard Rectangle (2.62:1)', value: 'standard' },
  { label: 'Stick (Small Rectangle)', value: 'stick' },
  { label: 'Twig (Thin Rectangle)', value: 'twig' },
  { label: 'Circle (Ornament)', value: 'circle' },
];

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Page title="Map Builder Settings">
      <Layout>
        <Layout.Section>
          {actionData?.success && (
            <Banner status="success" onDismiss={() => {}}>
              {actionData.message}
            </Banner>
          )}
          
          <Card title="Map Configuration">
            <Form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Select
                label="Default Map Size"
                options={MAP_SIZE_OPTIONS}
                value={settings.defaultMapSize}
                name="defaultMapSize"
              />
              
              <TextField
                label="Default Zoom Level"
                value={settings.defaultZoom}
                name="defaultZoom"
                type="number"
                min="1"
                max="20"
                helpText="Default zoom level for new maps (1-20)"
              />
              
              <TextField
                label="Maximum File Size (MB)"
                value={settings.maxFileSize}
                name="maxFileSize"
                type="number"
                min="1"
                max="50"
                helpText="Maximum file size for generated maps"
              />
              
              <TextField
                label="Minimum File Size (MB)"
                value={settings.minFileSize}
                name="minFileSize"
                type="number"
                min="1"
                max="30"
                helpText="Minimum file size for generated maps"
              />
              
              <TextField
                label="Max Custom Elements"
                value={settings.maxCustomElements}
                name="maxCustomElements"
                type="number"
                min="1"
                max="20"
                helpText="Maximum number of text/icons customers can add"
              />
              
              <Button submit primary>
                Save Settings
              </Button>
            </Form>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Supported Aspect Ratios">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settings.allowedAspectRatios.map((ratio, index) => (
                <div key={index} style={{ padding: '8px', background: '#f6f6f7', borderRadius: '4px' }}>
                  <strong>{ratio}</strong> - {
                    ratio === '2.62:1' ? 'Standard Rectangle' :
                    ratio === '4.0:1' ? 'Twig (Long Rectangle)' :
                    ratio === '1.0:1' ? 'Circle' : 'Custom'
                  }
                </div>
              ))}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}