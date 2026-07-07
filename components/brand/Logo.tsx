import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/brand/logo.png";

type LogoProps = {
  size?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
  /** 검은 배경이 들어간 PNG를 밝은(크림) 헤더에 쓸 때 */
  onLightBackground?: boolean;
};

/** 확정 브랜드 로고 — 파비콘과 동일 마크 */
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
      alt="ahaitsme"
      width={size}
      height={size}
      priority={priority}
      unoptimized={onLightBackground}
      className={[
        "object-contain",
        onLightBackground ? "mix-blend-screen" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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

  return <span className="inline-flex shrink-0 items-center justify-center">{image}</span>;
}
