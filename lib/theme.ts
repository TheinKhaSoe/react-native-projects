import { Appearance, Platform } from "react-native";
import { colorScheme } from "react-native-css";
import type { ThemeMode } from "./types";

/**
 * NativeWind v5 (react-native-css) exposes an observable colorScheme object.
 * The `dark:` Tailwind variant resolves against it. It already listens for
 * system changes — we re-apply the user's chosen mode so an explicit
 * Light/Dark selection survives system theme flips.
 *
 * IMPORTANT (web): on web the compiled stylesheet wraps every `dark:` class in
 * `@media (prefers-color-scheme: dark)` — i.e. the CSS always follows the
 * browser/OS setting, NOT the in-app toggle. Only native evaluates the media
 * query in JS against `colorScheme`. So on web we always resolve to the
 * browser scheme: forcing anything else would leave the JS-driven colors
 * (tab bar, status bar) disagreeing with the page colors — light text on a
 * white background, etc.
 */

let mode: ThemeMode = "system";

export function resolveScheme(mode: ThemeMode): "light" | "dark" {
  if (Platform.OS === "web") return Appearance.getColorScheme() ?? "light";
  if (mode === "system") return Appearance.getColorScheme() ?? "light";
  return mode;
}

export function applyTheme(next: ThemeMode): void {
  mode = next;
  colorScheme.set(resolveScheme(mode));
}

export function currentThemeMode(): ThemeMode {
  return mode;
}

export function watchSystemTheme(onChange?: (scheme: "light" | "dark") => void) {
  const sub = Appearance.addChangeListener(() => {
    applyTheme(mode);
    onChange?.(resolveScheme(mode));
  });
  return () => sub.remove();
}
