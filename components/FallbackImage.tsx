import React, { useState } from "react";
import { Image, ImageProps } from "react-native";

/**
 * Displays an image, and if loading fails, automatically shows a fallback image.
 * Use in all recipe and preset cards to prevent red screens if an image is missing.
 */
export default function FallbackImage(props: ImageProps & { fallback?: any }) {
  const [failed, setFailed] = useState(false);
  const source = failed && props.fallback ? props.fallback : props.source;

  return (
    <Image
      {...props}
      source={source}
      onError={() => setFailed(true)}
      resizeMode={props.resizeMode || "cover"}
    />
  );
}
