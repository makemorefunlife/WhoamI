import type { ReactNode } from "react";

/** Shared card layout for the Toss success/fail return pages (Stitch styling). */
export default function TossResultShell({
  tone,
  title,
  body,
  children,
}: {
  tone: "progress" | "success" | "warning" | "error";
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const badge =
    tone === "success"
      ? "border-[#3A8F6E]/30 bg-[#E3F2EC] text-[#3A8F6E]"
      : tone === "error"
        ? "border-rose-300 bg-rose-50 text-rose-600"
        : tone === "warning"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-[#3A8F6E]/30 bg-[#F5F0E8] text-[#3A8F6E]";
  return (
    <div className="stitch-landing relative flex min-h-[75vh] w-full flex-col items-center justify-center bg-[#FAF7F0] px-4 py-6 sm:min-h-[80vh] sm:py-12">
      <main id="main" className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div className="rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-6 text-center shadow-[0_20px_50px_rgba(26,51,40,0.08)] sm:p-10">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border sm:mb-6 sm:h-16 sm:w-16 ${badge}`}>
            {tone === "progress" ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : tone === "success" ? (
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <span className="text-2xl font-bold">!</span>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#1A3328] break-keep sm:mb-3">{title}</h1>
          <p className="mx-auto mb-4 text-sm leading-relaxed text-[#4A5C52] break-keep sm:mb-6">{body}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
