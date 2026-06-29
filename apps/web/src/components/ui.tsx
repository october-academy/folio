import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 border-[3px] border-foreground px-4 py-2 text-sm font-black shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50",
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
