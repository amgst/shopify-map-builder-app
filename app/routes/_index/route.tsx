import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import styles from "./styles.module.css";

export const loader = async () => {
  return json({ appName: "Custom Map Builder" });
};

export default function App() {
  const { appName } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Welcome to {appName}</h1>
        <p className={styles.text}>
          Create custom maps for your products with our easy-to-use map builder.
        </p>
        
        <div style={{ margin: "2rem 0" }}>
          <Link 
            to="/map-editor" 
            className={styles.button}
            style={{ 
              display: "inline-block", 
              textDecoration: "none",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "6px",
              fontWeight: "bold"
            }}
          >
            Start Building Maps
          </Link>
        </div>
        
        <ul className={styles.list}>
          <li>
            <strong>Easy Map Creation</strong>. Build custom maps with our intuitive interface.
          </li>
          <li>
            <strong>Multiple Formats</strong>. Choose from rectangles, sticks, twigs, and circles.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
