// app/my-reviews.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BORDER, CARD, MUTED, RADIUS, SURFACE, TEXT } from "../lib/recipes";

const STAR = "#FFD54A";

function renderStars(avg: number) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.25 && avg - full < 0.75;
  const out: JSX.Element[] = [];
  for (let i = 0; i < full; i++) out.push(<Ionicons key={`s${i}`} name="star" size={16} color={STAR} />);
  if (half) out.push(<Ionicons key="half" name="star-half" size={16} color={STAR} />);
  const remain = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < remain; i++) out.push(<Ionicons key={`o${i}`} name="star-outline" size={16} color={STAR} />);
  return out;
}

const SAMPLE = {
  avg: 4.6,
  count: 37,
  items: [
    { stars: 5, who: "@pizza_poppy", when: "Nov 2", text: "Your garlic parm wing method is perfect—crispy and juicy!" },
    { stars: 4.5, who: "@veggie_vibes", when: "Nov 1", text: "Clear steps, love the oven timing callouts. Tofu tacos slapped." },
    { stars: 4, who: "@sous_sammy", when: "Oct 29", text: "Solid techniques. Would love metric weights on ingredients next time." },
    { stars: 5, who: "@sweet_tooth_sara", when: "Oct 25", text: "Your air fryer donut hack… chef’s kiss." },
    { stars: 4.5, who: "@midnight_snacker", when: "Oct 22", text: "Late-night ramen upgrade was elite. Quick and tasty." },
  ],
};

export default function MyReviews() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
          <Text style={styles.title}>My Chef Reviews</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <View style={{ flexDirection: "row", gap: 2 }}>{renderStars(SAMPLE.avg)}</View>
            <Text style={{ color: TEXT, fontWeight: "800" }}>{SAMPLE.avg.toFixed(1)}</Text>
            <Text style={{ color: MUTED }}>({SAMPLE.count})</Text>
          </View>
        </View>

        {/* List */}
        <View style={styles.card}>
          {SAMPLE.items.map((r, i) => (
            <View
              key={i}
              style={{
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: BORDER,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ flexDirection: "row", gap: 2 }}>{renderStars(r.stars)}</View>
                  <Text style={{ color: MUTED, fontSize: 12 }}>{r.when}</Text>
                </View>
                <Text style={{ color: MUTED, fontSize: 12 }}>{r.who}</Text>
              </View>
              <Text style={{ color: TEXT, marginTop: 6 }}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },
  title: { color: TEXT, fontSize: 22, fontWeight: "800" },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    marginHorizontal: 16,
    paddingHorizontal: 14,
  },
});
