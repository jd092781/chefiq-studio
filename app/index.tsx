import { Redirect } from "expo-router";

// First screen: send users into the tab navigator at Home.
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
