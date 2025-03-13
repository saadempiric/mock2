"use client";

import { useState, useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get the user's preferred color scheme from localStorage or default to 'light'
  const [colorScheme, setColorScheme] = useLocalStorage<"light" | "dark">({
    key: "mantine-color-scheme",
    defaultValue: "light",
  });

  // Synchronize with system preference on initial mount
  useEffect(() => {
    // Check if user has a stored preference
    const storedScheme = localStorage.getItem("mantine-color-scheme");

    if (!storedScheme) {
      // If no preference is stored, use system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setColorScheme(systemPrefersDark ? "dark" : "light");
    }

    // Set the color scheme on the HTML element
    document.documentElement.setAttribute(
      "data-mantine-color-scheme",
      colorScheme
    );
  }, [colorScheme, setColorScheme]);

  return (
    <MantineProvider
      defaultColorScheme={colorScheme}
      theme={{
        primaryColor: "violet",
        fontFamily: "var(--font-geist-sans)",
        fontFamilyMonospace: "var(--font-geist-mono)",
        headings: { fontFamily: "var(--font-geist-sans)" },
      }}
    >
      {children}
    </MantineProvider>
  );
}
