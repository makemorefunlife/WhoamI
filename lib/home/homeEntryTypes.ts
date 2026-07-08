/** 홈·랜딩 진입 상태 (Stitch 단일 플로우) */
export type ResumeState = {
  loading: boolean;
  reportId: string | null;
  hasReport: boolean;
  surveyCompleted: boolean;
  birthDate: string | null;
};

export type RelCounts = { pending: number; completed: number };
