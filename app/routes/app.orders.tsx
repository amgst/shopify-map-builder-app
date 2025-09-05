import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Badge, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Query orders with map builder properties
  const response = await admin.graphql(`
    query getOrdersWithMaps($first: Int!) {
      orders(first: $first, query: "tag:map-builder") {
        nodes {
          id
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customAttributes {
            key
            value
          }
          lineItems(first: 10) {
            nodes {
              title
              quantity
              customAttributes {
                key
                value
              }
            }
          }
        }
      }
    }
  `, {
    variables: { first: 50 }
  });

  const { data } = await response.json();
  
  // Process orders to extract map data
  const mapOrders = data.orders.nodes.map(order => {
    const mapItems = order.lineItems.nodes.filter(item => 
      item.customAttributes.some(attr => attr.key === '_Map Builder')
    );
    
    return {
      id: order.id,
      name: order.name,
      createdAt: new Date(order.createdAt).toLocaleDateString(),
      total: `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`,
      mapItems: mapItems.length,
      hasMapData: mapItems.length > 0
    };
  }).filter(order => order.hasMapData);

  return json({ orders: mapOrders });
};

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();

  const rows = orders.map(order => [
    order.name,
    order.createdAt,
    order.total,
    <Badge status={order.mapItems > 0 ? "success" : "attention"}>
      {order.mapItems} Map{order.mapItems !== 1 ? 's' : ''}
    </Badge>,
    <Button size="slim" onClick={() => window.open(`/admin/orders/${order.id.split('/').pop()}`, '_blank')}>
      View Order
    </Button>
  ]);

  return (
    <Page title="Map Builder Orders">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Order', 'Date', 'Total', 'Maps', 'Action']}
              rows={rows}
              footerContent={`Showing ${orders.length} orders with custom maps`}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}