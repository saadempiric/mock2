"use client";

import { ActionIcon, useComputedColorScheme, Tooltip } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export function ColorSchemeToggle() {
  const computedColorScheme = useComputedColorScheme("light");
  const [isDark, setIsDark] = useState(computedColorScheme === "dark");

  // Update internal state when computed color scheme changes
  useEffect(() => {
    setIsDark(computedColorScheme === "dark");
  }, [computedColorScheme]);

  const toggleColorScheme = () => {
    const nextColorScheme = isDark ? "light" : "dark";
    // Update DOM
    document.documentElement.setAttribute(
      "data-mantine-color-scheme",
      nextColorScheme
    );
    // Save to localStorage
    localStorage.setItem("mantine-color-scheme", nextColorScheme);
    // Update local state immediately
    setIsDark(!isDark);

    // Force a reload of CSS variables
    document.body.className = document.body.className;

    // If needed, you can force a full page reload, but this is a last resort
    // window.location.reload();
  };

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <ActionIcon
        onClick={toggleColorScheme}
        variant="outline"
        size="lg"
        color={isDark ? "yellow" : "blue"}
        aria-label="Toggle color scheme"
      >
        {isDark ? (
          <IconSun size={18} stroke={1.5} />
        ) : (
          <IconMoon size={18} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
