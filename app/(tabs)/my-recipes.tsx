// app/(tabs)/my-recipes.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---- Theme (dark + green accent) ----
const ACCENT = "#4dd08c";
const SURFACE = "#0F0F0F";
const CARD = "#171717";
const TEXT = "#FFFFFF";
const MUTED = "#9CA3AF";
const BORDER = "#2A2A2A";
const RADIUS = 14;

// ---- Types / Storage ----
type Ingredient = { id: string; text: string };
type Step = { id: string; text: string; photoUri?: string };

export type RecipeDraft = {
  id: string;
  title: string;
  description?: string;
  coverUri?: string;
  ingredients: Ingredient[];
  steps: Step[];
  // extra fields that may be present from create.tsx
  applianceSupport?: any;
  preset?: string;
  lastUpdated: number;
};

const DRAFT_KEY = "chefIQ_drafts_v2";

export default function MyRecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [drafts, setDrafts] = useState<RecipeDraft[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrafts = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      const list: RecipeDraft[] = raw ? JSON.parse(raw) : [];
      list.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      setDrafts(list);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDrafts();
    }, [loadDrafts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDrafts();
    setRefreshing(false);
  }, [loadDrafts]);

  const confirmDelete = useCallback((id: string) => {
    Alert.alert("Delete recipe?", "This will remove it from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(DRAFT_KEY);
            const list: RecipeDraft[] = raw ? JSON.parse(raw) : [];
            const filtered = list.filter((d) => d.id !== id);
            await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
            setDrafts(filtered);
          } catch {
            // ignore
          }
        },
      },
    ]);
  }, []);

  const empty = useMemo(() => !loading && (!drafts || drafts.length === 0), [loading, drafts]);

  const openCreate = useCallback(() => router.push("/create"), [router]);
  const openDraft = useCallback(
    (id: string) => router.push({ pathname: "/create", params: { id } }),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: RecipeDraft }) => (
      <Pressable
        onPress={() => openDraft(item.id)}
        onLongPress={() => confirmDelete(item.id)}
        style={{
          flexDirection: "row",
          backgroundColor: CARD,
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        {/* Thumbnail */}
        {item.coverUri ? (
          <Image
            source={{ uri: item.coverUri }}
            style={{ width: 84, height: 64, borderRadius: 10, marginRight: 12 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 84,
              height: 64,
              borderRadius: 10,
              marginRight: 12,
              backgroundColor: "#1C1C1C",
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: MUTED, fontWeight: "700" }}>IMG</Text>
          </View>
        )}

        {/* Meta */}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>
            {item.title?.trim() || "Untitled Recipe"}
          </Text>
          {!!item.description && (
            <Text numberOfLines={1} style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
              {item.description}
            </Text>
          )}
          <Text style={{ color: MUTED, marginTop: 6, fontSize: 11 }}>
            Updated {timeAgo(item.lastUpdated)}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ marginLeft: 12, flexDirection: "row" }}>
          <Pressable
            onPress={() => openDraft(item.id)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: ACCENT,
              borderRadius: 999,
              marginRight: 8,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800", fontSize: 12 }}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/view-recipe", params: { id: item.id } })
            }
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: BORDER,
              alignSelf: "flex-start",
              backgroundColor: "transparent",
            }}
          >
            <Text style={{ color: "#D1D5DB", fontWeight: "700", fontSize: 12 }}>Preview</Text>
          </Pressable>
        </View>
      </Pressable>
    ),
    [confirmDelete, openDraft, router]
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: Math.max(12, insets.top + 6),
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: TEXT, fontSize: 22, fontWeight: "800", flex: 1 }}>My Recipes</Text>
        <Pressable
          onPress={openCreate}
          style={{
            backgroundColor: ACCENT,
            borderRadius: RADIUS,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#111", fontWeight: "800" }}>New</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: MUTED, marginTop: 8 }}>Loading…</Text>
        </View>
      ) : empty ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              backgroundColor: CARD,
            }}
          >
            <Text style={{ color: MUTED, fontSize: 28 }}>🧑‍🍳</Text>
          </View>
          <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>
            No recipes yet
          </Text>
          <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
            Start a recipe and it’ll appear here. Long-press to delete.
          </Text>
          <Pressable
            onPress={openCreate}
            style={{
              marginTop: 16,
              backgroundColor: ACCENT,
              borderRadius: RADIUS,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800" }}>Create Recipe</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={drafts || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl tintColor={MUTED} refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

// --- Utilities ---
function timeAgo(timestamp?: number) {
  if (!timestamp) return "just now";
  const diff = Date.now() - timestamp;
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}
