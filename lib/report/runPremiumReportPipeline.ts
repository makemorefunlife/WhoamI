import { hasCompleteBirthInfo } from "@/lib/report/reportBirthUtils";
import {
  buildAstrologyContextForLlm,
  buildSurveyOnlyPrompt,
} from "@/lib/report/reportPromptBuilders";

export type PremiumPipelineCallbacks = {
  onStreamChunk?: (accumulated: string) => void;
  onStreamingChange?: (streaming: boolean) => void;
};

export type PremiumPipelineResult = {
  unifiedReport: string | null;
  sajuStatus: { attempted: boolean; ok: boolean };
  relationship: string | null;
  freeSummary: string | null;
};

/**
 * 심화(유료) 통합 리포트 생성 — 사주·점성·관계·LLM 통합 (기본 분석과 분리)
 */
export async function runPremiumReportPipeline(
  reportId: string,
  report: Record<string, unknown>,
  interpretations: Record<string, string>,
  patterns: Record<string, string> | null,
  callbacks: PremiumPipelineCallbacks = {},
): Promise<PremiumPipelineResult> {
  const { onStreamChunk, onStreamingChange } = callbacks;
  let sajuStatus: { attempted: boolean; ok: boolean } = {
    attempted: false,
    ok: false,
  };
  let relationship: string | null = null;
  let freeSummary: string | null = null;
  let unifiedReport: string | null = null;

  let localSajuData: unknown = null;

  if (!hasCompleteBirthInfo(report)) {
    return { unifiedReport: null, sajuStatus, relationship, freeSummary };
  }

  sajuStatus = { attempted: true, ok: false };
  const sr = await fetch("/api/saju", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      birthDate: report.birth_date,
      birthTime: report.birth_time,
      birthPlace: report.birth_place ?? undefined,
      reportId,
    }),
  });

  if (sr.ok) {
    localSajuData = await sr.json();
    sajuStatus = { attempted: true, ok: true };
  }

  let localAstrologyText: string | null = null;
  if (sajuStatus.ok) {
    try {
      const birthDateObj = new Date(String(report.birth_date));
      const ar = await fetch("/api/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: birthDateObj.getFullYear(),
          month: birthDateObj.getMonth() + 1,
          day: birthDateObj.getDate(),
          hour: report.birth_time
            ? parseInt(String(report.birth_time).split(":")[0], 10)
            : 12,
          minute: report.birth_time
            ? parseInt(String(report.birth_time).split(":")[1], 10)
            : 0,
          latitude: 37.5665,
          longitude: 126.978,
          timezone: 9,
        }),
      });
      if (ar.ok) {
        const astroData = await ar.json();
        const interp =
          typeof astroData.interpretation === "string"
            ? astroData.interpretation.trim()
            : "";
        if (interp) {
          localAstrologyText = interp;
        } else {
          const raw = astroData.raw as
            | { sun?: string; moon?: string; rising?: string }
            | undefined;
          const sun = raw?.sun ?? astroData.sun;
          const moon = raw?.moon ?? astroData.moon;
          const rising = raw?.rising ?? astroData.rising;
          if (sun && moon && rising) {
            localAstrologyText = buildAstrologyContextForLlm({
              sun,
              moon,
              rising,
            });
          }
        }
      }
    } catch (e) {
      console.error("점성학 API 실패:", e);
    }
  }

  try {
    const res = await fetch("/api/relationship/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    if (res.ok) {
      const data = await res.json();
      relationship = data.relationship ?? data.astrology ?? null;
    }
  } catch (relationshipErr) {
    console.error("관계 맥락 생성 API 실패:", relationshipErr);
  }

  try {
    const freePromptData = buildSurveyOnlyPrompt(interpretations);
    const freeRes = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "free",
        userInput: freePromptData,
      }),
    });
    const freeData = await freeRes.json();
    freeSummary = freeData.free ?? null;
  } catch {
    freeSummary = null;
  }

  if (!sajuStatus.ok) {
    return { unifiedReport: null, sajuStatus, relationship, freeSummary };
  }

  const detailedRes = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "detailed_survey",
      patterns,
    }),
  });
  const detailedData = await detailedRes.json();

  const combinedAstrology = [localAstrologyText, relationship]
    .filter(Boolean)
    .join("\n\n");

  onStreamingChange?.(true);
  unifiedReport = "";

  try {
    const integratedRes = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "integrated",
        detailedSurvey: detailedData.report,
        sajuData: localSajuData ?? null,
        astrologyText: combinedAstrology || null,
        stream: true,
      }),
    });

    if (!integratedRes.ok) {
      const errJson = await integratedRes.json().catch(() => ({}));
      unifiedReport = `통합 리포트를 만들지 못했어요. ${String((errJson as { error?: string }).error ?? "잠시 후 다시 열어보세요.")}`;
    } else {
      const ct = integratedRes.headers.get("content-type") ?? "";
      if (ct.includes("text/plain") && integratedRes.body) {
        const reader = integratedRes.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          onStreamChunk?.(acc);
        }
        unifiedReport = acc;
      } else {
        const integratedData = await integratedRes.json();
        unifiedReport = integratedData.report ?? "";
        onStreamChunk?.(unifiedReport);
      }
    }
  } catch (streamErr) {
    console.error(streamErr);
    unifiedReport =
      "통합 리포트를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
    onStreamChunk?.(unifiedReport);
  } finally {
    onStreamingChange?.(false);
  }

  return { unifiedReport, sajuStatus, relationship, freeSummary };
}
