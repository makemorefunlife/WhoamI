import type { PolicyDocument } from "@/lib/legal/types";

/** 개인정보 처리방침 — 문구만 수정하면 페이지에 반영됩니다. */
export const privacyPolicy: PolicyDocument = {
  title: "개인정보 처리방침",
  description:
    "Ahaitsme(아하잇츠미) — 설문·사주·점성·관계 분석 리포트 서비스의 개인정보 처리 안내입니다.",
  lastUpdated: "2026-06-01",
  sections: [
    {
      id: "overview",
      title: "1. 개요",
      paragraphs: [
        "아하잇츠미(이하 \"운영자\")는 Ahaitsme를 운영합니다. Ahaitsme는 출생 정보와 v2 10문항 설문, 사주·점성 계산, AI 통합 해석을 결합해 개인 리포트와 친구 초대 기반 관계 분석을 제공하는 자기 이해·관계 탐색 서비스입니다.",
        "본 방침은 Ahaitsme 웹·앱 이용 시 적용되며, 전 세계 이용자를 대상으로 합니다.",
      ],
    },
    {
      id: "controller",
      title: "2. 문의처",
      paragraphs: [
        "개인정보 처리자: 아하잇츠미",
        "일반 문의: support@ahaitsme.com",
        "개인정보·삭제·열람 요청: privacy@ahaitsme.com",
        "서비스 내 Contact(문의하기) 페이지에서도 연락할 수 있습니다.",
      ],
    },
    {
      id: "collected",
      title: "3. Ahaitsme에서 다루는 정보",
      paragraphs: [
        "리포트(report) 단위로 데이터가 저장됩니다. 이용 흐름에 따라 아래 정보가 수집·생성될 수 있습니다.",
      ],
      listItems: [
        "계정: 이메일, 표시 이름, Clerk 등 인증 제공자를 통한 로그인 식별자",
        "프로필·출생: 이름(닉네임), 생년월일, 출생 시각, 출생지, 성별(선택), 위치 기반 점성 좌표",
        "설문: v2 10문항 응답 및 Human Framework 6축 프로필",
        "사주·점성: 만세력 기반 사주팔자 계산 결과, 출생 차트(행성·하우스 등) 요약",
        "리포트·AI 결과: 기본·심화(통합) 개인 리포트, 관계 분석 본문, 캐시된 분석 텍스트",
        "관계·초대: 초대 토큰, 연결된 상대 report ID, 관계 분석 상태",
        "결제: 주문·거래 식별자(카드 정보는 토스페이먼츠 등 PG가 직접 처리)",
        "기술: IP, 접속 로그, 기기·브라우저, 쿠키",
      ],
    },
    {
      id: "ai-processing",
      title: "4. AI로 리포트를 만드는 방식",
      paragraphs: [
        "Ahaitsme는 리포트 문장 생성·통합·관계 해석에 AI 제공업체(예: OpenAI)를 사용합니다.",
        "이용자가 입력한 출생 정보, 설문 응답, 프로필 정보, 관계 분석에 필요한 데이터(본인 및 연결된 상대의 리포트 맥락)가 AI 처리 과정에 포함될 수 있습니다.",
        "처리 목적은 개인 리포트, 심화(통합) 리포트, 관계 분석 리포트 생성·저장·표시에 한정되며, 운영자는 이를 제3자에게 판매하지 않습니다.",
      ],
    },
    {
      id: "relationship-data",
      title: "5. 관계 분석과 다른 사람의 정보",
      paragraphs: [
        "관계 분석은 초대 링크(/invite) 등을 통해 두 사람의 report를 연결한 뒤, 각자의 출생·설문·사주·점성·AI 해석을 조합합니다.",
        "이 과정에서 이용자가 자발적으로 제공하거나 연결에 동의한 다른 사람에 관한 정보(출생 정보, 설문·리포트 요약 등)가 처리될 수 있습니다.",
        "타인 정보 입력 전 상대방의 적절한 동의를 받았는지 이용자가 확인해야 합니다.",
      ],
    },
    {
      id: "purpose",
      title: "6. 이용 목적",
      paragraphs: ["수집·생성된 정보는 다음에 사용됩니다."],
      listItems: [
        "회원 인증, report 생성·관리",
        "개인·심화·관계 분석 리포트 제공 및 URL·QR 공유",
        "유료 결제, 초대권·관계 분석 권한 부여, 환불",
        "문의 응대, 베타 공지, 서비스 개선·오류 대응",
        "적용 법령에 따른 기록 보관",
      ],
    },
    {
      id: "third-party",
      title: "7. 함께 쓰는 외부 서비스",
      paragraphs: [
        "Ahaitsme 운영을 위해 아래 서비스에 데이터가 저장·전송될 수 있습니다.",
      ],
      listItems: [
        "로그인: Clerk",
        "DB·API: Supabase",
        "AI 리포트 생성: OpenAI",
        "결제: 토스페이먼츠",
        "이메일(도입 시): Resend 등",
      ],
    },
    {
      id: "retention",
      title: "8. 보관·삭제",
      paragraphs: [
        "report·계정 삭제 요청 또는 목적 달성 후 지체 없이 삭제합니다. 법령상 필요한 결제·거래 기록만 해당 기간 보관할 수 있습니다.",
        "분석 결과가 DB(report_analyses 등)에 캐시되어 재생성 비용을 줄이는 경우, 삭제 요청 시 관련 행을 함께 삭제합니다.",
      ],
    },
    {
      id: "rights",
      title: "9. 이용자 권리",
      paragraphs: [
        "열람·정정·삭제·처리 제한을 privacy@ahaitsme.com 또는 Contact로 요청할 수 있습니다. 계정·report 식별 정보를 함께 알려주시면 처리가 빠릅니다.",
      ],
    },
    {
      id: "security",
      title: "10. 보안",
      paragraphs: [
        "HTTPS, 서비스 롤 키·RLS 등 Supabase 접근 통제, 최소 권한 원칙을 적용합니다.",
      ],
    },
    {
      id: "children",
      title: "11. 만 14세 미만",
      paragraphs: [
        "Ahaitsme는 만 14세 미만을 대상으로 하지 않습니다.",
      ],
    },
    {
      id: "changes",
      title: "12. 방침 변경",
      paragraphs: [
        "베타·기능 추가(예: 구독)에 따라 본 방침을 수정할 수 있으며, 중요한 변경은 서비스 내에 안내합니다.",
        "시행일: 페이지 상단 \"최종 업데이트\" 날짜를 따릅니다.",
      ],
    },
  ],
};
