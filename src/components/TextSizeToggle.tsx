import { useEffect, useState } from "react";
import { Type } from "lucide-react";

const STORAGE_KEY = "text-size-mode";

export function TextSizeToggle() {
  const [large, setLarge] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "large";
    setLarge(saved);
    document.documentElement.classList.toggle("text-lg-mode", saved);
  }, []);

  const toggle = () => {
    const next = !large;
    setLarge(next);
    document.documentElement.classList.toggle("text-lg-mode", next);
    localStorage.setItem(STORAGE_KEY, next ? "large" : "comfortable");
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={large}
      aria-label={large ? "Switch to comfortable text size" : "Switch to large text size"}
      title={large ? "Comfortable text" : "Large text"}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Type className="w-3.5 h-3.5" />
      <span className={large ? "text-sm font-semibold" : "text-[10px] font-semibold"}>A</span>
    </button>
  );
}