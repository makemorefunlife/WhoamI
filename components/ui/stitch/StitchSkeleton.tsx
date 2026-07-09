"use client";

type StitchSkeletonProps = {
  className?: string;
};

/** 은은한 shimmer 스켈레톤 블록 */
export function StitchSkeleton({ className = "" }: StitchSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-container-low/70 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
    </div>
  );
}

export function FriendStoryRowSkeleton() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="Loading friends">
      <div className="flex items-center justify-between gap-3">
        <StitchSkeleton className="h-6 w-24" />
        <StitchSkeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="flex items-start gap-4 pb-1 pt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <StitchSkeleton className="aspect-square h-16 w-16 shrink-0 rounded-full" />
            <StitchSkeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HubAnalysisListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="Loading analysis">
      <StitchSkeleton className="h-6 w-20" />
      <div className="space-y-0 overflow-hidden rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest/80">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 border-b border-outline-variant/15 px-5 py-2.5 last:border-b-0"
          >
            <StitchSkeleton className="h-4 w-36" />
            <StitchSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RelationHubActionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden>
      <StitchSkeleton className="h-12 rounded-2xl" />
      <StitchSkeleton className="h-12 rounded-2xl" />
    </div>
  );
}
