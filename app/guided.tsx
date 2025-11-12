// app/guided.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  ACCENT,
  BORDER,
  CARD,
  MUTED,
  RADIUS,
  RECIPE_LIBRARY,
  SURFACE,
  TEXT,
  type ApplianceKey,
  type RecipeFull,
} from "../lib/recipes";

/** Keys shared with Home screen */
const INPROG_KEY = "chefiq_inprogress";
const HISTORY_KEY = "chefiq_history";

/* ---------- Time/Temp defaults ---------- */
const GENERIC_DEFAULTS: Record<ApplianceKey, Record<string, string>> = {
  minioven: {
    "Air Fry": "390°F · 6–10 min",
    Bake: "375–425°F · time varies",
    Roast: "300–400°F · until target doneness",
    Broil: "High · 2–6 min",
    Proof: "85–95°F · 45–90 min",
    Reheat: "325°F · 6–10 min",
    Dehydrate: "135°F · 2–6 hr",
  },
  cooker: {
    "Pressure Cook": "High Pressure · 35–90 min",
    "Sear/Sauté": "High · 3–8 min / batch",
    "Slow Cook": "Low · 6–8 hr",
    Steam: "High Steam · 5–12 min",
    "Keep Warm": "Warm · as needed",
  },
};

const RECIPE_DEFAULTS: Record<
  string,
  Partial<Record<ApplianceKey, Record<string, string>>>
> = {
  "4": {
    minioven: {
      "Air Fry": "390°F · 6–9 min",
      Bake: "475°F · 6–9 min (stone/steel preheated)",
      Broil: "High · 1–3 min finish",
      Reheat: "375°F · 4–6 min (on hot stone)",
    },
  },
  "1": {
    minioven: { Roast: "250°F · until 200–205°F & probe-tender" },
    cooker: {
      "Pressure Cook": "High Pressure · 70–90 min + natural release",
      "Slow Cook": "Low · 8–10 hr",
    },
  },
  "2": {
    minioven: {
      "Air Fry": "390°F · 6–8 min (flip once)",
      Bake: "425°F · 10–12 min (flip once)",
      Broil: "High · 1–2 min finish (watch closely)",
    },
  },
  "3": {
    minioven: { Roast: "275°F · to 200–205°F (wrap when ~165°F)" },
    cooker: {
      "Pressure Cook": "High Pressure · 60–90 min + natural release",
      "Slow Cook": "Low · 8–10 hr",
    },
  },
};

function labelToKey(label?: string): ApplianceKey | null {
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes("mini")) return "minioven";
  if (l.includes("cooker")) return "cooker";
  return null;
}

function getModeDefaults(
  recipeId: string,
  applianceLabel?: string,
  mode?: string | null
): string | null {
  const key = labelToKey(applianceLabel);
  if (!key || !mode) return null;
  const byRecipe = RECIPE_DEFAULTS[recipeId]?.[key]?.[mode];
  if (byRecipe) return byRecipe;
  return GENERIC_DEFAULTS[key][mode] || null;
}

/* ---------- Mode-specific tips ---------- */
function getTips(appliance?: string, mode?: string): string[] {
  if (!appliance) return [];
  const a = (appliance || "").toLowerCase();
  const m = (mode || "").toLowerCase();

  if (a.includes("mini oven")) {
    const base = [
      "Use the recommended rack position; airflow matters.",
      "Preheat fully for best browning.",
    ];
    if (m === "air fry") {
      return [
        ...base,
        "Don’t overcrowd—leave space for circulation.",
        "Flip or shake halfway for even crisping.",
      ];
    }
    if (m === "bake") {
      return [
        ...base,
        "Preheat a stone/steel 15+ min for pizza and breads.",
        "Avoid opening the door early—it dumps heat.",
      ];
    }
    if (m === "roast") {
      return [
        ...base,
        "Start high for browning, then drop temp if needed.",
        "Use a probe thermometer for proteins.",
      ];
    }
    if (m === "broil") {
      return [
        "Keep food 4–6 inches from the element; watch closely.",
        "Dark pans speed browning; light pans slow it.",
      ];
    }
    if (m === "proof") return ["Cover dough to prevent drying; lightly oil the bowl."];
    if (m === "reheat")
      return [
        "Lower temps + a few minutes prevent drying.",
        "Reheat pizza on a hot stone for crisp bottoms.",
      ];
    if (m === "dehydrate")
      return ["Slice uniformly; thinner dries faster.", "Prop the door slightly if safe for extra airflow."];
    return base;
  }

  if (a.includes("cooker")) {
    const base = [
      "Ensure gasket and valve are seated before pressurizing.",
      "Add enough thin liquid (water/stock) to reach pressure.",
    ];
    if (m.includes("pressure"))
      return [
        ...base,
        "Natural release for tough meats; quick release for delicate items.",
        "Add dairy thickeners after pressure cooking.",
      ];
    if (m.includes("sear") || m.includes("sauté"))
      return ["Let the pot preheat; brown in batches to avoid steaming."];
    if (m.includes("slow")) return ["Keep the lid on; add fresh herbs/acid at the end for brightness."];
    if (m.includes("steam")) return ["Use a steamer rack; keep food above the liquid."];
    if (m.includes("warm")) return ["Cover and add a splash of liquid to prevent drying."];
    return base;
  }
  return [];
}

type InProgress = {
  id: string;
  title: string;
  coverUri?: string;
  currentStep: number;
  totalSteps: number;
  updatedAt: number;
  appliance?: string; // label (Mini Oven/Cooker)
  mode?: string;      // Air Fry, Roast, etc.
};

export default function Guided() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [prog, setProg] = useState<InProgress | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [showTipsCard, setShowTipsCard] = useState(true);

  // refs to keep the active step visible
  const scrollRef = useRef<ScrollView | null>(null);
  const itemYRef = useRef<number[]>([]);

  const scrollToActive = useCallback((index: number) => {
    const y = itemYRef.current[index] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }, []);

  // Load in-progress or seed from route
  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(INPROG_KEY);
      const parsed: InProgress | null = raw ? JSON.parse(raw) : null;

      const routeId = (params?.id as string) || parsed?.id;
      const routeStep =
        typeof params?.step === "string" && !isNaN(Number(params.step))
          ? Number(params.step)
          : parsed?.currentStep ?? 0;

      if (routeId) {
        const lib: RecipeFull | undefined = RECIPE_LIBRARY[routeId];
        const base: InProgress = {
          id: routeId,
          title: lib?.title ?? parsed?.title ?? "Recipe",
          coverUri: lib?.coverUri ?? parsed?.coverUri,
          currentStep: Math.max(0, Math.min(routeStep, (lib?.steps?.length ?? 1) - 1)),
          totalSteps: lib?.steps?.length ?? parsed?.totalSteps ?? 1,
          updatedAt: Date.now(),
          appliance: (params?.appliance as string) ?? parsed?.appliance,
          mode: (params?.mode as string) ?? parsed?.mode,
        };
        setProg(base);
        setSteps(lib?.steps ?? []);
        await AsyncStorage.setItem(INPROG_KEY, JSON.stringify(base));
        // slight delay so list measures before scrolling
        setTimeout(() => scrollToActive(base.currentStep), 50);
      } else {
        setProg(null);
        setSteps([]);
      }
    } catch {
      setProg(null);
      setSteps([]);
    }
  }, [params, scrollToActive]);

  useEffect(() => {
    load();
  }, [load]);

  // Persist step change
  const saveStep = useCallback(
    async (nextIndex: number) => {
      if (!prog) return;
      const updated: InProgress = { ...prog, currentStep: nextIndex, updatedAt: Date.now() };
      setProg(updated);
      await AsyncStorage.setItem(INPROG_KEY, JSON.stringify(updated));
      scrollToActive(nextIndex);
    },
    [prog, scrollToActive]
  );

  const onNext = async () => {
    if (!prog) return;
    const next = Math.min(prog.currentStep + 1, (steps?.length ?? 1) - 1);
    await saveStep(next);
  };

  const onBack = async () => {
    if (!prog) return;
    const prev = Math.max(prog.currentStep - 1, 0);
    await saveStep(prev);
  };

  // History on finish
  const pushHistory = useCallback(async (id: string) => {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, 25);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }, []);

  const onFinish = async () => {
    try {
      if (prog?.id) await pushHistory(prog.id);
      await AsyncStorage.removeItem(INPROG_KEY);
      router.replace("/(tabs)/home");
    } catch {
      router.replace("/(tabs)/home");
    }
  };

  const onExit = async () => {
    try {
      await AsyncStorage.removeItem(INPROG_KEY);
      router.back();
    } catch {
      router.back();
    }
  };

  if (!prog) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={{ color: TEXT, marginBottom: 8 }}>No active guided session.</Text>
        <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.goHomeBtn}>
          <Text style={{ color: "#111", fontWeight: "800" }}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const tipList = getTips(prog.appliance, prog.mode);
  const defaultsText = getModeDefaults(prog.id, prog.appliance, prog.mode);
  const isFirstStep = prog.currentStep === 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: SURFACE }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Pressable onPress={onExit} hitSlop={10} style={{ marginRight: 8 }}>
            <Ionicons name="close" size={20} color={TEXT} />
          </Pressable>
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: "800", flex: 1 }}>{prog.title}</Text>
        </View>
        <Text style={{ color: MUTED, marginTop: 2 }}>
          {prog.appliance || "Method"}
          {prog.mode ? ` • ${prog.mode}` : ""}
        </Text>
        <Text style={{ color: MUTED, marginTop: 2 }}>
          Step {prog.currentStep + 1} of {prog.totalSteps}
        </Text>
      </View>

      {/* Suggested Time/Temp */}
      {defaultsText ? (
        <View style={styles.tipRow}>
          <Ionicons name="flame-outline" size={18} color={ACCENT} style={{ marginRight: 8 }} />
          <Text style={{ color: TEXT, fontWeight: "800" }}>
            Suggested: {prog.mode} — {defaultsText}
          </Text>
        </View>
      ) : null}

      {/* Tips */}
      {tipList.length > 0 && (isFirstStep || showTipsCard) ? (
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={{ color: TEXT, fontWeight: "800" }}>Tips for {prog.mode || prog.appliance}</Text>
            <Pressable onPress={() => setShowTipsCard((s) => !s)} hitSlop={8}>
              <Text style={{ color: ACCENT, fontWeight: "800" }}>
                {showTipsCard && !isFirstStep ? "Hide" : "Hide"}
              </Text>
            </Pressable>
          </View>
          {tipList.map((t, i) => (
            <Text key={i} style={{ color: TEXT, marginBottom: 6 }}>• {t}</Text>
          ))}
        </View>
      ) : null}

      {/* ALL STEPS — one page */}
      <View style={{ gap: 10 }}>
        {steps.map((s, idx) => {
          const active = idx === prog.currentStep;
          const completed = idx < prog.currentStep;
          const locked = idx > prog.currentStep;

          const onLayout = (e: LayoutChangeEvent) => {
            itemYRef.current[idx] = e.nativeEvent.layout.y;
          };

          return (
            <View
              key={idx}
              onLayout={onLayout}
              style={[
                styles.stepCard,
                active && styles.stepActive,
                completed && styles.stepCompleted,
                locked && styles.stepLocked,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                {completed ? (
                  <Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginRight: 8 }} />
                ) : active ? (
                  <Ionicons name="play-circle" size={18} color={ACCENT} style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color={MUTED} style={{ marginRight: 10 }} />
                )}
                <Text
                  style={[
                    styles.stepTitle,
                    completed && { color: "#B6F7D0" },
                    active && { color: TEXT },
                    locked && { color: MUTED },
                  ]}
                >
                  Step {idx + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  completed && { opacity: 0.8 },
                  active && { opacity: 1 },
                  locked && { opacity: 0.5 },
                ]}
              >
                {s}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Controls */}
      <View style={{ flexDirection: "row", marginTop: 14 }}>
        <Pressable
          onPress={onBack}
          disabled={prog.currentStep === 0}
          style={[
            styles.navBtn,
            { marginRight: 10, backgroundColor: CARD, borderColor: BORDER },
            prog.currentStep === 0 && { opacity: 0.5 },
          ]}
        >
          <Text style={{ color: TEXT, fontWeight: "700" }}>Back</Text>
        </Pressable>

        {prog.currentStep < prog.totalSteps - 1 ? (
          <Pressable onPress={onNext} style={[styles.navBtn, { backgroundColor: ACCENT }]}>
            <Text style={{ color: "#111", fontWeight: "800" }}>Next</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onFinish} style={[styles.navBtn, { backgroundColor: ACCENT }]}>
            <Text style={{ color: "#111", fontWeight: "800" }}>Finish</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyScreen: {
    flex: 1,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  goHomeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: ACCENT,
    borderRadius: 10,
  },

  tipRow: {
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  tipsCard: {
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  stepCard: {
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  stepActive: {
    borderColor: ACCENT,
    backgroundColor: "rgba(77, 208, 140, 0.08)",
  },
  stepCompleted: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  stepLocked: {
    // just greyed via text opacity styles
  },
  stepTitle: { fontWeight: "800", color: TEXT },
  stepText: { color: TEXT, lineHeight: 22 },

  navBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
});
