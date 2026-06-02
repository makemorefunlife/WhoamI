import type { PolicyDocument } from "@/lib/legal/types";

/** 이용약관 — 문구만 수정하면 페이지에 반영됩니다. */
export const termsOfService: PolicyDocument = {
  title: "이용약관",
  description:
    "Ahaitsme 베타 이용 약관입니다. 설문·사주·점성·AI·관계 분석을 이용하기 전에 읽어 주세요. 문의: support@ahaitsme.com",
  lastUpdated: "2026-06-01",
  sections: [
    {
      id: "acceptance",
      title: "1. 약관 동의",
      paragraphs: [
        "본 약관은 아하잇츠미가 제공하는 Ahaitsme(이하 \"서비스\") 이용 조건을 정합니다.",
        "로그인, 설문 제출, 리포트 열람, 결제, 친구 초대 등 서비스를 이용하면 본 약관에 동의한 것으로 봅니다.",
      ],
    },
    {
      id: "service",
      title: "2. Ahaitsme가 제공하는 것",
      paragraphs: [
        "Ahaitsme는 한 사람당 하나의 report를 만들고, 18문항 설문·출생 정보·사주(만세력)·점성 차트·AI 해석을 조합해 개인 리포트를 제공합니다.",
        "유료 이용 시 심화(통합) 리포트, 친구 초대, 두 사람의 관계 분석 등이 제공될 수 있습니다.",
        "베타 기간에는 기능·UI·가격·정책이 예고 없이 변경될 수 있습니다.",
      ],
    },
    {
      id: "ai-disclaimer",
      title: "3. AI Analysis Disclaimer",
      paragraphs: [
        "Ahaitsme는 행동 심리(설문 패턴), 점성술(출생 차트), 사주(사주팔자), 관계 분석, AI가 생성·통합한 해석을 함께 사용합니다.",
        "이 모든 결과는 자기 성찰(self-reflection), 학습, 오락(entertainment), 일반 정보 제공(informational purposes)을 위한 것입니다.",
        "의료·심리 치료·법률·재무·기타 전문적 조언이 아니며, 진단·처방·투자 권유·법적 결론을 대체하지 않습니다.",
        "이별, 치료, 투자, 고용, 이혼 등 중요한 결정은 서비스 결과만으로 내리지 마세요. 그에 대한 책임은 전적으로 이용자에게 있습니다.",
        "AI 리포트는 실행마다 표현이 달라질 수 있으며, 사실과 다르거나 불완전할 수 있습니다.",
      ],
    },
    {
      id: "relationship-disclaimer",
      title: "4. Relationship Analysis",
      paragraphs: [
        "관계 분석은 두 report의 데이터를 바탕으로 한 해석적·정보 제공 목적의 콘텐츠입니다.",
        "궁합 점수, 관계 성공, 미래 사건, 갈등 해결 여부 등을 보장하거나 예측하지 않습니다.",
        "결과를 사실적 판정이나 확정적 결론으로 취급해서는 안 됩니다. 참고 자료로만 활용해 주세요.",
        "초대 링크로 연결된 상대방도 자신의 report와 분석 결과에 대한 권리를 가질 수 있습니다.",
      ],
    },
    {
      id: "third-party-info",
      title: "5. Third-Party Information",
      paragraphs: [
        "친구 초대·관계 분석을 위해 다른 사람의 출생 정보·이름·설문 맥락 등을 입력할 때, 해당인의 적절한 허락(동의)을 받아야 합니다.",
        "동의 없이 타인의 개인정보를 입력·공유하는 것은 금지됩니다.",
        "이용자가 제공한 제3자 정보로 인해 발생하는 분쟁·클레임·손해에 대해, 법이 허용하는 범위에서 이용자가 책임집니다. 운영자는 이용자 간 법적 분쟁의 당사자가 아닙니다.",
      ],
    },
    {
      id: "account",
      title: "6. 계정과 report",
      paragraphs: [
        "출생 시각·장소 등은 리포트 품질에 영향을 주므로 정확히 입력해 주세요.",
        "계정(Clerk)과 report는 별도로 관리됩니다. 로그인·초대·결제 권한 관리 책임은 이용자에게 있습니다.",
        "report URL·QR을 공유할 때는 수신자가 내용을 볼 수 있음을 인지해 주세요.",
      ],
    },
    {
      id: "paid",
      title: "7. 유료 기능",
      paragraphs: [
        "심화 리포트, 관계 분석, 초대권 등 유료 상품의 가격·포함 내용은 결제 화면에 표시된 내용을 따릅니다.",
        "결제는 토스페이먼츠 등 지정 PG를 통해 처리됩니다.",
      ],
    },
    {
      id: "refund",
      title: "8. 환불",
      paragraphs: [
        "환불은 「환불 정책」 페이지를 따릅니다.",
      ],
    },
    {
      id: "prohibited",
      title: "9. 금지 행위",
      paragraphs: ["다음은 금지됩니다."],
      listItems: [
        "타인 정보 무단 입력·유출",
        "리포트·API 비정상 호출, 역설계, 서비스 장애 유발",
        "AI에 혐오·불법·타인 비방 입력 유도",
        "Ahaitsme 리포트 무단 복제·재판매",
      ],
    },
    {
      id: "ip",
      title: "10. 지식재산",
      paragraphs: [
        "Ahaitsme UI, 브랜드, 프롬프트·DB 구조, 리포트 템플릿에 대한 권리는 아하잇츠미 또는 권리자에게 있습니다.",
        "이용자 입력(설문·출생 정보)에 대한 권리는 이용자에게 있으나, 서비스 제공·개선·캐시를 위해 필요한 범위에서 이용·저장할 수 있습니다.",
      ],
    },
    {
      id: "disclaimer",
      title: "11. 책임의 한계",
      paragraphs: [
        "통신·AI·PG·DB 장애 등 운영자가 합리적으로 통제하기 어려운 사유로 인한 손해는 법이 허용하는 범위에서 책임이 제한될 수 있습니다.",
        "서비스는 베타 단계로 \"있는 그대로\" 제공됩니다.",
      ],
    },
    {
      id: "termination",
      title: "12. 이용 제한",
      paragraphs: [
        "약관 위반, 타인 정보 무단 입력, 시스템 악용 시 이용을 제한하거나 계정·report 접근을 차단할 수 있습니다.",
        "탈퇴·삭제는 support@ahaitsme.com 또는 Contact로 요청할 수 있습니다.",
      ],
    },
    {
      id: "law",
      title: "13. 기타",
      paragraphs: [
        "본 약관은 대한민국 법을 기준으로 해석합니다.",
        "문의: support@ahaitsme.com · 개인정보: privacy@ahaitsme.com",
      ],
    },
  ],
};
