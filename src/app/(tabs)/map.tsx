import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { fetchClientsWithCoords } from "../../lib/clients";
import { Client } from "../../types/client";

export default function Map() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClientsWithCoords()
      .then(setClients)
      .catch((e) => console.log("Error loading map clients:", e.message));
  }, []);

  // center on first client, or a sensible default
  const initialRegion =
    clients.length > 0
      ? {
          latitude: Number(clients[0].latitude),
          longitude: Number(clients[0].longitude),
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }
      : {
          latitude: 35.2271,
          longitude: -80.8431,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={initialRegion}>
        {clients.map((client) => (
          <Marker
            key={client.id}
            coordinate={{
              latitude: Number(client.latitude),
              longitude: Number(client.longitude),
            }}
            title={client.name}
            description={client.address}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});