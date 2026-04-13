"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
};

export default function GlowButton({
  children,
  className,
  href,
  ...props
}: Props) {
  const merged = clsx(
    "glow-button inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl px-6 py-3.5 text-[15px] font-semibold tracking-tight",
    "disabled:cursor-not-allowed disabled:opacity-60",
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
    <button className={merged} {...props}>
      {children}
    </button>
  );
}
