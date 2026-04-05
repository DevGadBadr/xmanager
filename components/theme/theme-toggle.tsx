"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      className="h-8 w-8"
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      <Sun className="hidden h-3 w-3 dark:block" />
      <Moon className="block h-3 w-3 dark:hidden" />
    </Button>
  );
}
