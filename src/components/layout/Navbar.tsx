"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import UserMenu from "@/components/auth/UserMenu";

interface NavbarProps {
  onStartCreating?: () => void;
}

export default function Navbar({ onStartCreating }: NavbarProps) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <nav
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        borderColor: "var(--border-subtle)",
        background: "color-mix(in srgb, var(--background) 85%, transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--brand-orange)" }}
          >
            PC
          </span>
          <span style={{ color: "var(--foreground)" }}>PromoClip</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                Dashboard
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium transition-opacity hover:opacity-80 hidden sm:inline"
                style={{ color: "var(--muted)" }}
              >
                Sign In
              </Link>
              {onStartCreating && (
                <button
                  onClick={onStartCreating}
                  className="text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ background: "var(--brand-orange)" }}
                >
                  Get Started
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
