import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
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

export default function MapWeb() {
  const [clients, setClients] = useState<Client[]>([]);

  console.log("MAP RENDER - clients count:", clients.length, clients);

  useEffect(() => {
    console.log("USEEFFECT RUNNING - about to fetch");
    fetchClientsWithCoords()
      .then((data) => {
        console.log("FETCH SUCCESS - got clients:", data);
        setClients(data);
      })
      .catch((e) => {
        console.log("FETCH FAILED - error:", e.message, e);
      });
  },[]);

  // center the map on the first client, or a default spot
  const center: [number, number] =
    clients.length > 0
      ? [Number(clients[0].latitude), Number(clients[0].longitude)]
      : [34.9496, -81.9321]; // Charlotte default

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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