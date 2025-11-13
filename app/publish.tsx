// app/publish.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

// ---- Theme (dark + green accent) ----
const ACCENT = "#4dd08c";
const SURFACE = "#0F0F0F";
const CARD = "#171717";
const TEXT = "#FFFFFF";
const MUTED = "#9CA3AF";
const BORDER = "#2A2A2A";
const RADIUS = 16;

type Ingredient = { id: string; text: string };
type Step = { id: string; text: string };
type ApplianceSupport = {
  minioven?: string[];
  cooker?: string[];
};

type RecipePayload = {
  id: string;
  title: string;
  description?: string;
  coverUri?: string;
  ingredients: Ingredient[];
  steps: Step[];
  preset?: string;
  applianceSupport?: ApplianceSupport;
  lastUpdated?: number;
};

export default function PublishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipe?: string }>();

  const [payload, setPayload] = useState<RecipePayload | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Decode payload from navigation params
  useEffect(() => {
    if (!params?.recipe) {
      setError("No recipe data was provided.");
      return;
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(params.recipe)) as RecipePayload;
      setPayload(parsed);
    } catch (e) {
      setError("We couldn’t read your recipe data.");
    }
  }, [params?.recipe]);

  // Post to echo endpoint once we have a payload
  useEffect(() => {
    if (!payload) return;

    const postRecipe = async () => {
      try {
        setPosting(true);
        setError(null);

        // This is the same echo endpoint they gave you — we just
        // don’t shove the JSON in the user’s face anymore.
        const res = await fetch("https://postman-echo.com/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        setPosted(true);
      } catch (err: any) {
        setError("There was a problem publishing your recipe. Please try again.");
      } finally {
        setPosting(false);
      }
    };

    postRecipe();
  }, [payload]);

  const ingredientsCount = payload?.ingredients?.filter((i) => i.text?.trim()).length || 0;
  const stepsCount = payload?.steps?.filter((s) => s.text?.trim()).length || 0;

  const applianceSummary = useMemo(() => {
    if (!payload?.applianceSupport) return "Not specified";
    const parts: string[] = [];
    if (payload.applianceSupport.minioven && payload.applianceSupport.minioven.length) {
      parts.push("Chef iQ Mini Oven");
    }
    if (payload.applianceSupport.cooker && payload.applianceSupport.cooker.length) {
      parts.push("iQ Cooker");
    }
    return parts.length ? parts.join(" · ") : "Not specified";
  }, [payload?.applianceSupport]);

  const onDone = () => {
    // Take the user somewhere friendly after publishing
    router.replace("/my-recipes");
  };

  const onTryAgain = () => {
    setPosted(false);
    setError(null);
    if (payload) {
      // re-trigger effect by resetting payload
      setPayload({ ...payload });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
      }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: TEXT,
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 16,
          }}
        >
          Publish
        </Text>

        {/* Status card */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
            marginBottom: 16,
          }}
        >
          {posting ? (
            <>
              <Text
                style={{
                  color: TEXT,
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Publishing your recipe…
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <ActivityIndicator color={ACCENT} />
                <Text style={{ color: MUTED, marginLeft: 8 }}>
                  Posting JSON to the Chef iQ test endpoint.
                </Text>
              </View>
            </>
          ) : error ? (
            <>
              <Text
                style={{
                  color: "#F87171",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                Something went wrong
              </Text>
              <Text style={{ color: MUTED, marginBottom: 12 }}>{error}</Text>
              <Pressable
                onPress={onTryAgain}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: ACCENT,
                  borderRadius: 999,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>Try Again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: TEXT,
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                Published Successfully
              </Text>
              <Text style={{ color: MUTED, marginBottom: 12 }}>
                Your recipe JSON was posted to the Chef iQ Studio echo endpoint.
              </Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Endpoint:{" "}
                <Text style={{ color: ACCENT }}>https://postman-echo.com/post</Text>
              </Text>
            </>
          )}
        </View>

        {/* Friendly summary of the recipe instead of raw JSON */}
        {payload && (
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: TEXT,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Recipe Overview
            </Text>
            <Text
              style={{
                color: TEXT,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              {payload.title?.trim() || "Untitled Recipe"}
            </Text>
            {!!payload.description && (
              <Text
                style={{
                  color: MUTED,
                  marginBottom: 10,
                }}
              >
                {payload.description}
              </Text>
            )}

            {!!payload.preset && (
              <Text style={{ color: MUTED, marginBottom: 4 }}>
                Category:{" "}
                <Text style={{ color: ACCENT, fontWeight: "600" }}>
                  {payload.preset}
                </Text>
              </Text>
            )}

            <Text style={{ color: MUTED, marginBottom: 4 }}>
              Ingredients:{" "}
              <Text style={{ color: ACCENT, fontWeight: "600" }}>
                {ingredientsCount}
              </Text>
            </Text>
            <Text style={{ color: MUTED, marginBottom: 4 }}>
              Steps:{" "}
              <Text style={{ color: ACCENT, fontWeight: "600" }}>{stepsCount}</Text>
            </Text>
            <Text style={{ color: MUTED }}>
              Appliances:{" "}
              <Text style={{ color: ACCENT, fontWeight: "600" }}>
                {applianceSummary}
              </Text>
            </Text>
          </View>
        )}

        {/* Advanced / optional JSON toggle */}
        {payload && (
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: TEXT,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Developer View (optional)
            </Text>
            <Text style={{ color: MUTED, marginBottom: 12 }}>
              If needed for documentation, you can view the exact JSON payload that
              was posted.
            </Text>

            <Pressable
              onPress={() => setShowJson((v) => !v)}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#111827",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: BORDER,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginBottom: showJson ? 12 : 0,
              }}
            >
              <Text style={{ color: ACCENT, fontWeight: "700" }}>
                {showJson ? "Hide JSON" : "Show JSON"}
              </Text>
            </Pressable>

            {showJson && (
              <View
                style={{
                  marginTop: 8,
                  maxHeight: 260,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: BORDER,
                  backgroundColor: "#020617",
                  padding: 10,
                }}
              >
                <ScrollView nestedScrollEnabled>
                  <Text
                    selectable
                    style={{
                      color: "#E5E7EB",
                      fontFamily: Platform.select({
                        ios: "Menlo",
                        android: "monospace",
                        default: "monospace",
                      }),
                      fontSize: 11,
                    }}
                  >
                    {JSON.stringify(payload, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom primary action */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={onDone}
          style={{
            backgroundColor: ACCENT,
            borderRadius: RADIUS,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "800", fontSize: 16 }}>
            Done
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
