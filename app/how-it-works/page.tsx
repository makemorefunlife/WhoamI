import Link from "next/link";

export const metadata = {
  title: "How it works — ahaitsme",
  description: "분석 방식 안내 (준비 중)",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
        How it works
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-primary">
        분석 방식 안내
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
        설문·사주·점성을 어떻게 엮어 해석하는지 설명할 페이지예요. 곧
        채워 넣을 예정입니다.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
      >
        홈으로
      </Link>
    </div>
  );
}
