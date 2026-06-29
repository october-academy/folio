// SPDX-License-Identifier: MIT
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const BUTTON_SIZES = {
  default: "h-11 px-4 py-2",
  sm: "h-9 px-3",
  icon: "h-11 w-11 p-0",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "default" | "sm" | "icon";
}) {
  return (
    <button
      className={cn(
        // Presses *into* the page: hover lifts toward the shadow origin + grows the
        // shadow; active snaps flat. transition-all so the shadow animates too.
        "inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-foreground text-sm font-black shadow-brutal-sm outline-none transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-50",
        BUTTON_SIZES[size],
        variant === "primary"
          ? "bg-accent text-accent-foreground"
          : "bg-background text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full border-[3px] border-foreground bg-background px-3 text-sm font-semibold shadow-brutal-sm outline-none focus:shadow-brutal",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full border-[3px] border-foreground bg-background px-3 py-2 text-sm font-semibold shadow-brutal-sm outline-none focus:shadow-brutal",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 border-[3px] border-foreground bg-background px-3 text-sm font-bold shadow-brutal-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}
