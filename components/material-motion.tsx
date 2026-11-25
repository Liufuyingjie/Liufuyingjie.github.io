"use client";

import { useEffect } from "react";

const controls = [
  ".nav-write", ".icon-button", ".list-tabs button", ".tag",
  ".sidebar-write", ".pagination button", ".article-sidebar-note > a",
  ".edit-paper-button", ".delete-paper-button", ".github-login-button",
  ".primary-button", ".template-option", ".editor-tabs button",
].join(",");

export default function MaterialMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showRipple(event: PointerEvent) {
      if (reducedMotion.matches || !event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>(controls);
      if (!control || control.matches(":disabled, [aria-disabled='true']")) return;

      const bounds = control.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const radius = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));
      const layer = document.createElement("span");
      const wave = document.createElement("span");
      layer.className = "material-ripple";
      layer.setAttribute("aria-hidden", "true");
      wave.style.left = `${x - radius}px`;
      wave.style.top = `${y - radius}px`;
      wave.style.width = wave.style.height = `${2 * radius}px`;
      layer.append(wave);
      control.append(layer);

      // Keep the state layer visible briefly after the pointer is released.
      const ripple = wave.animate([
        { scale: .12, opacity: .18 },
        { scale: 1, opacity: 0 },
      ], { duration: 460, easing: "cubic-bezier(.2, 0, 0, 1)" });
      void ripple.finished.then(() => layer.remove(), () => layer.remove());
    }

    if (typeof Element.prototype.animate !== "function") return;
    document.addEventListener("pointerdown", showRipple, { passive: true });
    return () => document.removeEventListener("pointerdown", showRipple);
  }, []);

  return null;
}
