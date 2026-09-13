import React from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenProps extends ViewProps {
  padded?: boolean;
  /**
   * Apply the bottom safe-area inset (gesture bar / home indicator).
   * Screens that manage their own bottom spacing — e.g. Chat, which must
   * trade that inset for the keyboard height — can turn it off.
   */
  bottomInset?: boolean;
  /** Applies Tailwind/NativeWind classes to the outer container. */
  className?: string;
}

/** Applies safe-area padding + base background for every screen. */
export function Screen({
  padded = true,
  bottomInset = true,
  className,
  style,
  children,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      // Every screen carries its own background so the gesture-bar / window
      // area never shows through as white in dark mode. Dark tone is a
      // readable dark grey (neutral-900) rather than near-black.
      className={`bg-slate-50 dark:bg-neutral-900 ${className ?? ""}`}
      style={[
        {
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: bottomInset ? insets.bottom : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
      {...rest}
    >
      <View style={[{ flex: 1 }, padded ? { paddingHorizontal: 16 } : null]}>{children}</View>
    </View>
  );
}
