// app/(tabs)/create.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---- Theme (Chef iQ dark) ----
const ORANGE = "#4dd08c"; // accent
const SURFACE = "#0F0F0F";
const CARD = "#171717";
const TEXT = "#FFFFFF";
const MUTED = "#9CA3AF";
const BORDER = "#2A2A2A";
const RADIUS = 16;

type Ingredient = { id: string; text: string };
type Step = { id: string; text: string };
type RecipeDraft = {
  id: string;
  title: string;
  description?: string;
  coverUri?: string;
  ingredients: Ingredient[];
  steps: Step[];
  lastUpdated: number;
};

const DRAFT_KEY = "chefIQ_drafts_v2";
const newId = () => {
  try {
    const g: any = globalThis as any;
    return g?.crypto?.randomUUID?.() ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
};

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

  // ---- SAVE DRAFT ----
  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const draft: RecipeDraft = {
        id,
        title: title.trim(),
        description: description.trim(),
        coverUri,
        ingredients,
        steps,
        lastUpdated: Date.now(),
      };
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
  }, [id, title, description, coverUri, ingredients, steps]);

  // ---- PUBLISH (mock) -> /publish (root) ----
  const onPublish = useCallback(() => {
    const payload: RecipeDraft = {
      id,
      title: title.trim(),
      description: description.trim(),
      coverUri,
      ingredients,
      steps,
      lastUpdated: Date.now(),
    };
    router.push({
      pathname: "/publish",
      params: { recipe: encodeURIComponent(JSON.stringify(payload)) }, // ✅ safe
    });
  }, [router, id, title, description, coverUri, ingredients, steps]);

  // ---- PREVIEW (read-only) -> /view-recipe (root) ----
  const onPreview = useCallback(() => {
    const payload: RecipeDraft = {
      id,
      title: title.trim(),
      description: description.trim(),
      coverUri,
      ingredients,
      steps,
      lastUpdated: Date.now(),
    };
    router.push({
      pathname: "/view-recipe",
      params: { recipe: encodeURIComponent(JSON.stringify(payload)) }, // ✅ safe
    });
  }, [router, id, title, description, coverUri, ingredients, steps]);

  // ---- UI ----
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED }}>Loading draft…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: SURFACE }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100, // leave room for floating toolbar
            paddingTop: Math.max(12, insets.top + 6),
          }}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* ACTIONS */}
          <View style={{ height: 20 }} />
          <View style={{ flexDirection: "row" }}>
            <Pressable
              onPress={saveDraft}
              disabled={saving}
              style={{
                flex: 1,
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: RADIUS,
                paddingVertical: 14,
                alignItems: "center",
                marginRight: 12,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ color: TEXT, fontWeight: "700" }}>{saving ? "Saving…" : "Save Draft"}</Text>
            </Pressable>

            <Pressable
              onPress={onPreview}
              style={{
                flex: 1,
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: RADIUS,
                paddingVertical: 14,
                alignItems: "center",
                marginRight: 12,
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
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>Publish</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Floating quick-add toolbar (so you don’t scroll back up) */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 16,
            bottom: Math.max(16, insets.bottom + 8),
            gap: 10,
          }}
        >
          <Pressable
            onPress={addIngredient}
            style={{
              backgroundColor: ORANGE,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800" }}>+ Ingredient</Text>
          </Pressable>
          <Pressable
            onPress={addStep}
            style={{
              backgroundColor: ORANGE,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800" }}>+ Step</Text>
          </Pressable>
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
