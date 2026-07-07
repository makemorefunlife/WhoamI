import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/brand/logo.png";

type LogoProps = {
  size?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
  /** 밝은(크림) 헤더 — 검은 배경이 남은 PNG 대비용 (투명 PNG면 생략 가능) */
  onLightBackground?: boolean;
};

/** 확정 브랜드 로고 — Ai 모노그램 */
export default function Logo({
  size = 32,
  href = "/",
  className = "",
  priority = false,
  onLightBackground = false,
}: LogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt="Aha It's me!"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={[
        "object-contain",
        onLightBackground ? "mix-blend-multiply" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center"
        aria-label="ahaitsme 홈"
      >
        {image}
      </Link>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center">
      {image}
    </span>
  );
}
