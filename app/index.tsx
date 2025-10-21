// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Send the app to the tabs stack -> Home
  return <Redirect href="/(tabs)/home" />;
}
