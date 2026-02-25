"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function UserMenu() {
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
        style={{ background: "var(--brand-orange)" }}
      >
        U
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 w-40 rounded-lg shadow-lg border py-1 z-50"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
