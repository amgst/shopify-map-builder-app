import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  List,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// The loader now gets the shop's domain so we can create a link to the theme editor
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  return json({ shop });
};

// We have removed the old 'action' function that created products.

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  // Construct the URL to the theme editor for the merchant's store
  const onlineStoreUrl = `https://${shop}/admin/themes`;

  return (
    <Page>
      <TitleBar title="Map Builder Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to the Custom Map Builder App! 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This tool allows you to add a customizable map designer
                    directly to your product pages.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    How to Get Started
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Follow these steps to add the map builder to a product:
                  </Text>
                  <List>
                    <List.Item>
                      Click the button below to go to your theme editor.
                    </List.Item>
                    <List.Item>
                      Using the dropdown at the top, navigate to the product
                      page you want to customize.
                    </List.Item>
                    <List.Item>
                      On the left sidebar under "Product information", click
                      <b> "Add block" </b> and select <b>"Map Builder"</b> from the Apps
                      section.
                    </List.Item>
                    <List.Item>
                      Drag the block to where you want it on the page and click "Save".
                    </List.Item>
                  </List>
                </BlockStack>
                <InlineStack>
                  <Button url={onlineStoreUrl} target="_blank" variant="primary">
                    Go to Theme Editor
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
             <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Support
                  </Text>
                  <Text as="p" variant="bodyMd">
                    If you have any questions or need help with the setup, please
                    refer to our documentation or contact support.
                  </Text>
                </BlockStack>
             </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}