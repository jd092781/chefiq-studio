// app/publish.tsx
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

export const unstable_settings = { headerShown: true, title: "Publish" } as const;


// ---- Theme (Chef iQ dark) ----
const ORANGE = "#4dd08c";
const SURFACE = "#0F0F0F";
const CARD = "#171717";
const TEXT = "#FFFFFF";
const MUTED = "#9CA3AF";
const BORDER = "#2A2A2A";
const RADIUS = 16;

type RecipeDraft = {
  id: string;
  title: string;
  description?: string;
  coverUri?: string;
  ingredients: { id: string; text: string }[];
  steps: { id: string; text: string; photoUri?: string }[];
  lastUpdated: number;
};

export default function PublishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipe?: string;
    webhook?: string; // optional override
  }>();

  // Extract & parse recipe JSON safely
  const recipeObj = useMemo<RecipeDraft | null>(() => {
    if (!params?.recipe) return null;
    try {
      // params.recipe will be URI-encoded by router
      const decoded = decodeURIComponent(params.recipe as string);
      return JSON.parse(decoded);
    } catch {
      try {
        // fallback in case it wasn't encoded
        return JSON.parse(params.recipe as string);
      } catch {
        return null;
      }
    }
  }, [params.recipe]);

  const [endpoint] = useState<string>(
    (params?.webhook as string) || "https://postman-echo.com/post"
  );
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsePreview, setResponsePreview] = useState<string | null>(null);

  const prettyRecipe = useMemo(
    () => (recipeObj ? JSON.stringify(recipeObj, null, 2) : ""),
    [recipeObj]
  );

  const doPublish = useCallback(async () => {
    if (!recipeObj) return;
    setPosting(true);
    setPosted(false);
    setError(null);
    setResponsePreview(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chefiq-Demo": "MiniOvenRecipePublish",
        },
        body: JSON.stringify(recipeObj),
      });
      const text = await res.text();
      // Keep preview short-ish
      const clipped = text.length > 2000 ? text.slice(0, 2000) + "\n…(truncated)" : text;
      if (!res.ok) {
        setError(`Publish failed: HTTP ${res.status}`);
        setResponsePreview(clipped);
      } else {
        setPosted(true);
        setResponsePreview(clipped);
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setPosting(false);
    }
  }, [endpoint, recipeObj]);

  useEffect(() => {
    if (!recipeObj) return;
    // Auto-publish on first mount
    doPublish();
  }, [doPublish, recipeObj]);

  const shareJson = useCallback(async () => {
    if (!recipeObj) return;
    try {
      const nameSafe = recipeObj.title?.trim()?.replace(/[^\w\-]+/g, "_") || "recipe";
      const fileUri = `${FileSystem.cacheDirectory}${nameSafe}_${recipeObj.id || Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(recipeObj, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing unavailable", "Your platform does not support the share sheet.");
        return;
      }
      await Sharing.shareAsync(fileUri);
    } catch {
      Alert.alert("Error", "Could not create or share the JSON file.");
    }
  }, [recipeObj]);

  const copyJson = useCallback(async () => {
    if (!prettyRecipe) return;
    try {
      await Clipboard.setStringAsync(prettyRecipe);
      Alert.alert("Copied", "Recipe JSON copied to clipboard.");
    } catch {
      Alert.alert("Error", "Could not copy to clipboard.");
    }
  }, [prettyRecipe]);

  const goDone = useCallback(() => {
    // If this screen sits on top of tabs, back is fine; otherwise replace to Drafts explicitly.
    try {
      router.back();
    } catch {
      router.replace("/Tabs/drafts");
    }
  }, [router]);

  if (!recipeObj) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800", marginBottom: 8 }}>
          No recipe data
        </Text>
        <Text style={{ color: MUTED, marginBottom: 16 }}>
          This screen expects a <Text style={{ color: TEXT, fontWeight: "700" }}>recipe</Text> param
          (JSON). Try publishing again from the Create screen.
        </Text>
        <Pressable
          onPress={goDone}
          style={{
            alignSelf: "flex-start",
            backgroundColor: ORANGE,
            borderRadius: RADIUS,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: "#111", fontWeight: "800" }}>Back to Drafts</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: SURFACE }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: "800" }}>Publish</Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: BORDER,
            backgroundColor: CARD,
          }}
        >
          <Text style={{ color: MUTED, fontSize: 12 }}>Mock</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        style={{ flex: 1 }}
      >
        {/* Card: Status */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 6 }}>
            {posted ? "Published Successfully" : posting ? "Publishing…" : error ? "Publish Failed" : "Ready to Publish"}
          </Text>
          <Text style={{ color: MUTED }}>
            Endpoint: <Text style={{ color: TEXT }}>{endpoint}</Text>
          </Text>

          <View style={{ height: 12 }} />
          {posting ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ color: MUTED, marginLeft: 8 }}>Sending recipe JSON…</Text>
            </View>
          ) : error ? (
            <Text style={{ color: "#FCA5A5" }}>{error}</Text>
          ) : posted ? (
            <Text style={{ color: "#86efac" }}>Your recipe JSON was posted to the echo endpoint.</Text>
          ) : (
            <Text style={{ color: MUTED }}>
              Tap “Publish” to POST your recipe JSON to the mock endpoint for the demo.
            </Text>
          )}

          <View style={{ height: 12 }} />
          <View style={{ flexDirection: "row" }}>
            <Pressable
              onPress={doPublish}
              disabled={posting}
              style={{
                backgroundColor: ORANGE,
                borderRadius: RADIUS,
                paddingHorizontal: 14,
                paddingVertical: 12,
                opacity: posting ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>
                {posting ? "Publishing…" : "Publish"}
              </Text>
            </Pressable>

            <Pressable
              onPress={goDone}
              style={{
                backgroundColor: CARD,
                borderRadius: RADIUS,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <Text style={{ color: TEXT, fontWeight: "700" }}>Done</Text>
            </Pressable>
          </View>
        </View>

        {/* Card: Share / Copy */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
            Share JSON
          </Text>
          <Text style={{ color: MUTED, marginBottom: 12 }}>
            Export the exact payload you posted. Great for the demo and documentation.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={shareJson}
              style={{
                backgroundColor: ORANGE,
                borderRadius: RADIUS,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>Share JSON</Text>
            </Pressable>
            <Pressable
              onPress={copyJson}
              style={{
                backgroundColor: CARD,
                borderRadius: RADIUS,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <Text style={{ color: TEXT, fontWeight: "700" }}>Copy JSON</Text>
            </Pressable>
          </View>
        </View>

        {/* Card: Recipe Preview */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
          }}
        >
          <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
            Recipe Payload
          </Text>
          <MonoBlock text={prettyRecipe} />
        </View>

        {/* Card: Response Preview */}
        {responsePreview && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 16,
            }}
          >
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
              Server Response (preview)
            </Text>
            <MonoBlock text={responsePreview} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MonoBlock({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: "#111218",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 12,
      }}
    >
      <Text
        style={{
          color: "#D1D5DB",
          fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
          fontSize: 12,
        }}
        selectable
      >
        {text}
      </Text>
    </View>
  );
}
