import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, View } from "react-native";

type Props = {
  value: number;                 // 0..5
  size?: number;
  editable?: boolean;
  onChange?: (n: number) => void;
  color?: string;
  emptyColor?: string;
};

export default function StarRating({
  value,
  size = 18,
  editable = false,
  onChange,
  color = "#F5C04E",
  emptyColor = "#3a3a3a",
}: Props) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1,2,3,4,5].map((n) => {
        const filled = value >= n - 0.5;
        const Star = (
          <Ionicons
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? color : emptyColor}
            style={{ marginRight: 4 }}
          />
        );
        if (!editable) return <View key={n}>{Star}</View>;
        return (
          <Pressable key={n} onPress={() => onChange?.(n)} hitSlop={8}>
            {Star}
          </Pressable>
        );
      })}
    </View>
  );
}
