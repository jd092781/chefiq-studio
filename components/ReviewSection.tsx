import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import StarRating from "./StarRating";

const ORANGE = "#4dd08c";
const SURFACE = "#0F0F0F";
const CARD = "#171717";
const TEXT = "#FFFFFF";
const MUTED = "#9CA3AF";
const BORDER = "#2A2A2A";
const RADIUS = 16;

const REVIEWS_KEY = "chefiq_reviews_v1";
type Review = { id: string; rating: number; text: string; date: number };

function newId() {
  try { return (globalThis as any)?.crypto?.randomUUID?.() ?? String(Date.now()); }
  catch { return String(Date.now()); }
}

async function loadAll(): Promise<Record<string, Review[]>> {
  const raw = await AsyncStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveAll(map: Record<string, Review[]>) {
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(map));
}

export default function ReviewSection({ recipeId }: { recipeId: string }) {
  const [items, setItems] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const remaining = 150 - text.length;

  useEffect(() => {
    (async () => {
      const db = await loadAll();
      setItems((db[recipeId] ?? []).sort((a,b) => b.date - a.date));
    })();
  }, [recipeId]);

  const summary = useMemo(() => {
    if (!items.length) return { avg: 0, count: 0 };
    const avg = items.reduce((s, r) => s + r.rating, 0) / items.length;
    return { avg, count: items.length };
  }, [items]);

  async function submit() {
    if (rating <= 0) { Alert.alert("Pick a rating", "Tap the stars to rate 1–5."); return; }
    const trimmed = text.trim().slice(0, 150);
    const db = await loadAll();
    const list = db[recipeId] ?? [];

    // Optional: prevent multiple reviews quickly by time window
    list.unshift({ id: newId(), rating, text: trimmed, date: Date.now() });
    db[recipeId] = list;
    await saveAll(db);

    setItems(list.slice());      // refresh
    setRating(0);
    setText("");
    Alert.alert("Thanks!", "Your review was saved.");
  }

  return (
    <View style={{ marginTop: 18 }}>
      {/* Header + average */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: "800", flex: 1 }}>Reviews</Text>
        <View style={{ alignItems: "flex-end" }}>
          <StarRating value={summary.avg} size={16} />
          <Text style={{ color: MUTED, fontSize: 12 }}>
            {summary.count ? `${summary.avg.toFixed(1)} • ${summary.count} review${summary.count>1?"s":""}` : "No reviews yet"}
          </Text>
        </View>
      </View>

      {/* Review form */}
      <View style={{
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: RADIUS, padding: 12, marginBottom: 12
      }}>
        <Text style={{ color: TEXT, fontWeight: "700", marginBottom: 8 }}>Leave a review</Text>
        <StarRating value={rating} editable onChange={setRating} size={22} />
        <TextInput
          value={text}
          onChangeText={(t) => t.length <= 150 && setText(t)}
          placeholder="150 characters max…"
          placeholderTextColor={MUTED}
          multiline
          style={{
            color: TEXT, backgroundColor: "#1B1B1B", borderColor: BORDER, borderWidth: 1,
            borderRadius: 12, padding: 10, marginTop: 10, minHeight: 70
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Text style={{ color: MUTED, flex: 1 }}>{remaining} left</Text>
          <Pressable
            onPress={submit}
            style={{
              backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: 999, opacity: rating ? 1 : 0.5
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800" }}>Submit</Text>
          </Pressable>
        </View>
      </View>

      {/* Reviews list (recent first) */}
      {items.length ? (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <StarRating value={item.rating} size={16} />
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              {!!item.text && <Text style={{ color: TEXT }}>{item.text}</Text>}
            </View>
          )}
        />
      ) : (
        <View style={{
          backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center"
        }}>
          <Text style={{ color: MUTED }}>No reviews yet. Be the first!</Text>
        </View>
      )}
    </View>
  );
}
