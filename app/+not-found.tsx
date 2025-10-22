// app/+not-found.tsx
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 }}>This screen doesn't exist.</Text>
      <Link href="/(tabs)/home" style={{ color: "#4dd08c", fontWeight: "700", fontSize: 16 }}>
        Go to home screen!
      </Link>
    </View>
  );
}
