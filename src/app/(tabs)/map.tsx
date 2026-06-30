import { StyleSheet, Text, View } from "react-native";

export default function Map() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view (native version coming next)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", justifyContent: "center", alignItems: "center" },
  text: { color: "#7a8a9a", fontSize: 16 },
});