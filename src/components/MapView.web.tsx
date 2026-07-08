import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { fetchClientsWithCoords } from "../lib/clients";
import { Client } from "../types/client";

// fix Leaflet's default marker icons (they don't load right by default)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Forces Leaflet to recalculate its size after mount — fixes blank/low-quality
// tiles on mobile Safari where the map initializes before knowing its real size.
function MapSizeFixer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    // recalc shortly after mount, and again a bit later for slow layouts
    const t1 = setTimeout(fix, 200);
    const t2 = setTimeout(fix, 800);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

export default function MapWeb() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClientsWithCoords()
      .then(setClients)
      .catch((e) => console.log("Error loading map clients:", e.message));
  }, []);

  // center the map on the first client, or a default spot
  const center: [number, number] =
    clients.length > 0
      ? [Number(clients[0].latitude), Number(clients[0].longitude)]
      : [34.9496, -81.9321];

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapSizeFixer />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {clients.map((client) => (
          <Marker
            key={client.id}
            position={[Number(client.latitude), Number(client.longitude)]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{client.name}</strong>
              <br />
              {client.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}