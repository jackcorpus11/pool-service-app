import { Suspense, lazy } from "react";

const MapView = lazy(() => import("../../components/MapView.web"));

export default function MapWebWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: "#7a8a9a" }}>Loading map…</div>}>
      <MapView />
    </Suspense>
  );
}