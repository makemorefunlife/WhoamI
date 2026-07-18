"use client";

import { useState, type ReactNode } from "react";
import { DeepEssencePartHeader } from "@/components/results/deep/DeepEssencePartHeader";

type Props = {
  number: string;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
  metaTone?: "accent" | "highlight" | "gold";
  defaultOpen?: boolean;
  children: ReactNode;
};

/** 로버블 ToggleSection 이식 — 파트 헤더를 누르면 본문이 펼쳐진다. */
export function DeepEssenceToggleSection({
  number,
  label,
  title,
  subtitle,
  meta,
  metaTone = "highlight",
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mt-10 first:mt-0">
      <DeepEssencePartHeader
        number={number}
        label={label}
        title={title}
        subtitle={subtitle}
        meta={meta}
        metaTone={metaTone}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open ? <div className="px-1 py-10 sm:py-12">{children}</div> : null}
    </section>
  );
}
