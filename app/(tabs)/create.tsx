// app/(tabs)/create.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PRESETS } from "../../lib/recipes";
import { upsertUserRecipe } from "../../lib/user-recipes";

// ---- Theme (Chef iQ dark) ----
const ORANGE = "#4dd08c"; // accent (publish / add)
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

type RecipeDraft = {
  id: string;
  title: string;
  description?: string;
  coverUri?: string;
  ingredients: Ingredient[];
  steps: Step[];
  applianceSupport?: ApplianceSupport;
  preset?: string; // category slug
  lastUpdated: number;
};

const DRAFT_KEY = "chefIQ_drafts_v2";
const POINTS_KEY = "chefiq_creator_points";
const newId = () => {
  try {
    const g: any = globalThis as any;
    return g?.crypto?.randomUUID?.() ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
};

// presets to show in one line (skip meta “all/favorites/history”)
const CATEGORY_OPTIONS = PRESETS.filter(
  (p) => !["all", "favorites", "history"].includes(p.slug)
);

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  // ---- State ----
  const [id, setId] = useState<string>(params?.id || newId());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState<boolean>(!!params?.id);

  // Appliances
  const [supportsMiniOven, setSupportsMiniOven] = useState<boolean>(false);
  const [supportsCooker, setSupportsCooker] = useState<boolean>(false);

  // Category selection
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);

  // ---- Category chips scroll indicator state ----
  const catScrollRef = useRef<ScrollView>(null);
  const [catContainerW, setCatContainerW] = useState(0);
  const [catContentW, setCatContentW] = useState(1); // avoid div by zero
  const [catScrollX, setCatScrollX] = useState(0);

  const onCatLayout = (w: number) => setCatContainerW(w);
  const onCatContentSizeChange = (w: number) => setCatContentW(Math.max(1, w));
  const onCatScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setCatScrollX(e.nativeEvent.contentOffset.x);

  // ---- Load existing draft by id (if opened from Drafts) ----
  useEffect(() => {
    (async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        const list: RecipeDraft[] = raw ? JSON.parse(raw) : [];
        const found = list.find((d) => d.id === params.id);
        if (found) {
          setId(found.id);
          setTitle(found.title || "");
          setDescription(found.description || "");
          setCoverUri(found.coverUri);
          setIngredients(found.ingredients || []);
          setSteps(found.steps || []);
          const a = found.applianceSupport ?? {};
          setSupportsMiniOven(!!(a.minioven && a.minioven.length));
          setSupportsCooker(!!(a.cooker && a.cooker.length));
          setSelectedPreset(found.preset);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  // ---- Helpers: updaters for lists ----
  const addIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, { id: newId(), text: "" }]);
  }, []);
  const updateIngredient = useCallback((iid: string, text: string) => {
    setIngredients((prev) => prev.map((i) => (i.id === iid ? { ...i, text } : i)));
  }, []);
  const removeIngredient = useCallback((iid: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== iid));
  }, []);

  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, { id: newId(), text: "" }]);
  }, []);
  const updateStep = useCallback((sid: string, text: string) => {
    setSteps((prev) => prev.map((s) => (s.id === sid ? { ...s, text } : s)));
  }, []);
  const removeStep = useCallback((sid: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== sid));
  }, []);

  // ---- COVER PICKER ----
  const pickCoverImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to add a cover.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    try {
      const filename = `cover_${id}${asset.fileName ? "_" + asset.fileName : ".jpg"}`;
      const dest = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      setCoverUri(dest);
    } catch {
      setCoverUri(asset.uri);
    }
  }, [id]);

  const makeApplianceSupport = (): ApplianceSupport => ({
    minioven: supportsMiniOven ? ["basic"] : [],
    cooker: supportsCooker ? ["basic"] : [],
  });

  const buildDraft = (): RecipeDraft => ({
    id,
    title: title.trim(),
    description: description.trim(),
    coverUri,
    ingredients,
    steps,
    applianceSupport: makeApplianceSupport(),
    preset: selectedPreset,
    lastUpdated: Date.now(),
  });

  // ---- SAVE DRAFT ----
  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const draft = buildDraft();
      const existingRaw = await AsyncStorage.getItem(DRAFT_KEY);
      const list: RecipeDraft[] = existingRaw ? JSON.parse(existingRaw) : [];
      const idx = list.findIndex((d) => d.id === id);
      if (idx >= 0) list[idx] = draft;
      else list.unshift(draft);
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(list));
      Alert.alert("Saved", "Draft saved locally.");
    } catch {
      Alert.alert("Error", "Could not save your draft.");
    } finally {
      setSaving(false);
    }
  }, [id, title, description, coverUri, ingredients, steps, supportsMiniOven, supportsCooker, selectedPreset]);

  // ---- PUBLISH ----
  const onPublish = useCallback(async () => {
    if (!supportsMiniOven && !supportsCooker) {
      Alert.alert("Select an appliance", "Choose at least one supported appliance to publish.");
      return;
    }
    if (!selectedPreset) {
      Alert.alert("Choose a category", "Please pick a preset category so your recipe is discoverable.");
      return;
    }

    const draft = buildDraft();

    await upsertUserRecipe({
      id: draft.id,
      title: draft.title || "Untitled",
      description: draft.description || "",
      coverUri: draft.coverUri,
      ingredients: draft.ingredients.map((i) => i.text).filter(Boolean),
      steps: draft.steps.map((s) => s.text).filter(Boolean),
      preset: draft.preset!,
      applianceSupport: draft.applianceSupport,
      meta: undefined,
      createdAt: Date.now(),
      avgRating: 0,
      ratingsCount: 0,
    });

    const raw = await AsyncStorage.getItem(POINTS_KEY);
    const current = raw ? Number(raw) || 0 : 0;
    const next = current + 25;
    await AsyncStorage.setItem(POINTS_KEY, String(next));

    const payload = draft;
    Alert.alert("Published 🎉", `You earned +25 Creator Points! Total: ${next}`, [
      {
        text: "OK",
        onPress: () =>
          router.push({
            pathname: "/publish",
            params: { recipe: encodeURIComponent(JSON.stringify(payload)) },
          }),
      },
    ]);
  }, [router, buildDraft, supportsMiniOven, supportsCooker, selectedPreset]);

  // ---- PREVIEW ----
  const onPreview = useCallback(() => {
    const payload = buildDraft();
    router.push({
      pathname: "/view-recipe",
      params: { recipe: encodeURIComponent(JSON.stringify(payload)) },
    });
  }, [router, buildDraft]);

  // ---- UI ----
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED }}>Loading draft…</Text>
      </View>
    );
  }

  /** Footer/dock sizing so content can scroll beneath it without being cut off */
  const DOCK_CARD_VPAD = 10 + 8 + 8; // padding + rows gap estimate
  const DOCK_ROW_H = 44;             // each row button height
  const DOCK_ROWS = 2;
  const DOCK_CARD_H = DOCK_CARD_VPAD + DOCK_ROW_H * DOCK_ROWS;
  const DOCK_OUTER_H = DOCK_CARD_H + 12 + insets.bottom; // outer padding + safe area
  const bottomPad = Math.max(48, DOCK_OUTER_H + 16);

  // ---- Category chips (with the exact same icons as Home, kept small) ----
  const CategoryChips = useMemo(
    () => (
      <View onLayout={(e) => onCatLayout(e.nativeEvent.layout.width)} style={{ gap: 8 }}>
        <ScrollView
          ref={catScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={(w) => onCatContentSizeChange(w)}
          onScroll={onCatScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CATEGORY_OPTIONS.map((opt) => {
              const active = selectedPreset === opt.slug;
              const Icon =
                (opt as any).iconLib === "mci"
                  ? (props: any) => (
                      <MaterialCommunityIcons name={(opt as any).icon as any} {...props} />
                    )
                  : (props: any) => <Ionicons name={(opt as any).icon as any} {...props} />;

              return (
                <Pressable
                  key={opt.slug}
                  onPress={() => setSelectedPreset((prev) => (prev === opt.slug ? undefined : opt.slug))}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: active ? ORANGE : CARD,
                    borderWidth: 1,
                    borderColor: active ? ORANGE : BORDER,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  {/* Small, same icons as Home */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? "#111" : "#1a1a1a",
                      borderWidth: 1,
                      borderColor: active ? "#111" : BORDER,
                    }}
                  >
                    <Icon size={16} color={active ? ORANGE : ORANGE} />
                  </View>
                  <Text style={{ color: active ? "#111" : TEXT, fontWeight: "800", fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* tiny custom scrollbar to hint horizontal scroll */}
        {catContentW > catContainerW ? (
          <View
            style={{
              height: 3,
              backgroundColor: "#1e1e1e",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {(() => {
              const ratio = catContainerW / catContentW;
              const thumbW = Math.max(24, catContainerW * ratio);
              const maxScroll = catContentW - catContainerW;
              const progress = Math.max(0, Math.min(1, catScrollX / Math.max(1, maxScroll)));
              const thumbLeft = (catContainerW - thumbW) * progress;
              return (
                <View
                  style={{
                    width: thumbW,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: ORANGE,
                    transform: [{ translateX: thumbLeft }],
                  }}
                />
              );
            })()}
          </View>
        ) : null}
      </View>
    ),
    [selectedPreset, catContainerW, catContentW, catScrollX]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      style={{ flex: 1, backgroundColor: SURFACE }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomPad, // ⬅️ enough space to scroll past the dock
            paddingTop: Math.max(12, insets.top + 6),
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* APPLIANCE SELECTOR */}
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
              Select appliance(s)
            </Text>
            <Text style={{ color: MUTED, marginBottom: 10 }}>
              Choose where this recipe can run. You can pick one or both.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <TogglePill
                label="Chef iQ Mini Oven"
                active={supportsMiniOven}
                onPress={() => setSupportsMiniOven((v) => !v)}
              />
              <TogglePill
                label="iQ Cooker"
                active={supportsCooker}
                onPress={() => setSupportsCooker((v) => !v)}
              />
            </View>
          </View>

          {/* CATEGORY SELECTOR — one line with icons + mini scrollbar */}
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
              Preset category
            </Text>
            <Text style={{ color: MUTED, marginBottom: 10 }}>
              Pick the category so others can find & review it.
            </Text>
            {CategoryChips}
          </View>

          {/* COVER CARD */}
          <Pressable
            onPress={pickCoverImage}
            style={{
              backgroundColor: CARD,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
            ) : (
              <View style={{ padding: 20, alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: BORDER,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: MUTED, fontSize: 24 }}>＋</Text>
                </View>
                <Text style={{ color: TEXT, fontSize: 16, fontWeight: "600" }}>Add Cover Photo</Text>
                <Text style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>Optional hero image</Text>
              </View>
            )}
          </Pressable>

          {/* TITLE */}
          <Field label="Title">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Crispy Garlic Wings"
              placeholderTextColor={MUTED}
              style={inputStyle}
            />
          </Field>

          {/* DESCRIPTION */}
          <Field label="Description">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short intro, timing, tips…"
              placeholderTextColor={MUTED}
              multiline
              style={[inputStyle, { minHeight: 90 }]}
            />
          </Field>

          {/* INGREDIENTS */}
          <SectionHeader title="Ingredients" right={<SmallButton label="Add" onPress={addIngredient} />} />
          {ingredients.length === 0 ? (
            <EmptyRow text="No ingredients yet" />
          ) : (
            <FlatList
              data={ingredients}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <RowCard>
                  <TextInput
                    value={item.text}
                    onChangeText={(t) => updateIngredient(item.id, t)}
                    placeholder="e.g., 2 tbsp olive oil"
                    placeholderTextColor={MUTED}
                    style={rowInputStyle}
                  />
                  <Pressable onPress={() => removeIngredient(item.id)} style={pillDelete}>
                    <Text style={{ color: "#111", fontWeight: "800" }}>Del</Text>
                  </Pressable>
                </RowCard>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}

          {/* STEPS */}
          <SectionHeader title="Steps" right={<SmallButton label="Add" onPress={addStep} />} />
          {steps.length === 0 ? (
            <EmptyRow text="No steps yet" />
          ) : (
            <FlatList
              data={steps}
              keyExtractor={(s) => s.id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <RowCard>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: MUTED, width: 48 }}>Step {index + 1}</Text>
                    <TextInput
                      value={item.text}
                      onChangeText={(t) => updateStep(item.id, t)}
                      placeholder="Describe the action…"
                      placeholderTextColor={MUTED}
                      style={[rowInputStyle, { flex: 1 }]}
                      multiline
                    />
                  </View>
                  <Pressable onPress={() => removeStep(item.id)} style={pillDelete}>
                    <Text style={{ color: "#111", fontWeight: "800" }}>Del</Text>
                  </Pressable>
                </RowCard>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* === SOLID bottom curtain so nothing shows through === */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: DOCK_OUTER_H + 8,
            backgroundColor: SURFACE,
            zIndex: 5,
          }}
          pointerEvents="none"
        />

        {/* === Unified fixed bottom dock === */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom || 8,
            paddingTop: 8,
            backgroundColor: SURFACE,
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: RADIUS,
              padding: 10,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            {/* Row 1: Save / Preview / Publish (green) */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              <Pressable
                onPress={saveDraft}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: CARD,
                  borderColor: BORDER,
                  borderWidth: 1,
                  borderRadius: RADIUS,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: saving ? 0.65 : 1,
                }}
              >
                <Text style={{ color: TEXT, fontWeight: "700" }}>
                  {saving ? "Saving…" : "Save Draft"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onPreview}
                style={{
                  flex: 1,
                  backgroundColor: CARD,
                  borderColor: BORDER,
                  borderWidth: 1,
                  borderRadius: RADIUS,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: TEXT, fontWeight: "700" }}>Preview</Text>
              </Pressable>

              <Pressable
                onPress={onPublish}
                style={{
                  flex: 1,
                  backgroundColor: ORANGE,
                  borderRadius: RADIUS,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>Publish</Text>
              </Pressable>
            </View>

            {/* Row 2: + Ingredient / + Step */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={addIngredient}
                style={{
                  flex: 1,
                  backgroundColor: ORANGE,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>+ Ingredient</Text>
              </Pressable>
              <Pressable
                onPress={addStep}
                style={{
                  flex: 1,
                  backgroundColor: ORANGE,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>+ Step</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---- Reusable bits ----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: TEXT, marginBottom: 6, fontWeight: "600" }}>{label}</Text>
      {children}
    </View>
  );
}
function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ marginTop: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800", flex: 1 }}>{title}</Text>
      {right}
    </View>
  );
}
function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: ORANGE,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: "#111", fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 12,
      }}
    >
      {children}
    </View>
  );
}
function EmptyRow({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: MUTED }}>{text}</Text>
    </View>
  );
}

const inputStyle = {
  color: TEXT,
  backgroundColor: CARD,
  borderColor: BORDER,
  borderWidth: 1,
  borderRadius: RADIUS,
  padding: 12,
} as const;

const rowInputStyle = {
  color: TEXT,
  backgroundColor: "#1B1B1B",
  borderColor: BORDER,
  borderWidth: 1,
  borderRadius: 12,
  padding: 10,
} as const;

const pillDelete = {
  marginTop: 10,
  alignSelf: "flex-start",
  backgroundColor: ORANGE,
  borderRadius: 999,
  paddingHorizontal: 12,
  paddingVertical: 8,
} as const;

function TogglePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? ORANGE : CARD,
        borderWidth: 1,
        borderColor: active ? ORANGE : BORDER,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: active ? "#111" : TEXT, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}
