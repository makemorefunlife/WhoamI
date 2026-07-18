"use client";

/**
 * 크림 톤(stitch) 리포트 페이지 공용 로딩/에러 상태.
 *
 * components/v2/LiteReportView.tsx의 LiteReportLoading/LiteReportError는
 * 어두운 스페이스 테마(GlassCard, text-white/55 등) 기준으로 만들어져 있어서
 * 크림 배경(#faf7f0) 위에서 쓰면 글자가 거의 안 보인다. 무료/유료 리포트를
 * 크림 테마로 옮기면서 생긴 공통 문제라 여기서 한 번에 해결한다.
 */
export function StitchReportLoading({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="stitch-hero-panel rounded-extra-large px-6 py-12 text-center">
      <p className="text-sm text-on-surface-variant">{message}</p>
      {hint ? <p className="mt-1 text-xs text-on-surface-variant/80">{hint}</p> : null}
    </div>
  );
}

export function StitchReportError({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="stitch-hero-panel rounded-extra-large space-y-3 px-6 py-8 text-center">
      <p className="text-accent-rose text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-primary text-sm underline-offset-2 hover:underline"
        >
          {retryLabel ?? "Retry"}
        </button>
      ) : null}
    </div>
  );
}
