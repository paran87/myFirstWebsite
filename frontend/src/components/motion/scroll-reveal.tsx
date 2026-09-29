"use client";

import { useEffect } from "react";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Reveals every `[data-reveal]` element with a fade-up as it scrolls into
 * view. Uses the Web Animations API rather than toggling classes, so the
 * DOM React hydrates and re-renders is never touched from outside React.
 * A MutationObserver picks up elements added later (client navigation,
 * infinite scroll). Optional `--reveal-delay` staggers siblings.
 */
export function ScrollReveal() {
  useEffect(() => {
    const done = new WeakSet<Element>();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = (el: Element) => {
      if (done.has(el)) return;
      done.add(el);
      const delay = parseFloat(getComputedStyle(el).getPropertyValue("--reveal-delay")) || 0;
      el.animate(
        [
          { opacity: 0, translate: "0 28px", scale: "0.985" },
          { opacity: 1, translate: "0 0", scale: "1" },
        ],
        { duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : delay, easing: EASE_OUT, fill: "both" }
      );
    };

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        if (!done.has(el)) io.observe(el);
      });
    };
    observe(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-reveal]") && !done.has(node)) io.observe(node);
          observe(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
