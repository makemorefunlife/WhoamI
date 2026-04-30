"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "disabled";
};

export default function GlowButton({
  children,
  className,
  href,
  variant = "primary",
  disabled,
  ...props
}: Props) {
  const variantClass =
    variant === "secondary"
      ? "glow-button-secondary"
      : variant === "ghost"
        ? "glow-button-ghost"
        : variant === "disabled"
          ? "glow-button-disabled"
          : "";
  const merged = clsx(
    "glow-button inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl px-6 py-3.5 text-[15px] font-semibold tracking-tight",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClass,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={merged}>
        {children}
      </Link>
    );
  }

  return (
    <button className={merged} disabled={disabled || variant === "disabled"} {...props}>
      {children}
    </button>
  );
}
