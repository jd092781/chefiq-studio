// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Send web users straight into the tabs navigator at Home
  return <Redirect href="/(tabs)/home" />;
}
