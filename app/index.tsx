<<<<<<< HEAD
import { Redirect } from "expo-router";

// First screen: send users into the tab navigator at Home.
export default function Index() {
=======
// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Send the app to the tabs stack -> Home
>>>>>>> 426a3154681dd9f1d7bc482709aa9babf7caaae7
  return <Redirect href="/(tabs)/home" />;
}
