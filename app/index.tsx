// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Send the user straight to the Home tab
  return <Redirect href="/(tabs)/home" />;
}
