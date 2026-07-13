/**
 * track() 런타임 PII 가드 회귀 테스트
 * 실행: npx tsx tests/scripts/analytics-track-runtime-guard.ts
 */
import { track, type AnalyticsEvent } from "@/lib/analytics/track";

type CapturedDispatch = {
  name: string;
  params: Record<string, string>;
};

const warnLogs: unknown[][] = [];
const debugLogs: unknown[][] = [];
let dispatches: CapturedDispatch[] = [];

const originalWarn = console.warn;
const originalDebug = console.debug;
const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

function installMocks() {
  warnLogs.length = 0;
  debugLogs.length = 0;
  dispatches = [];
  console.warn = (...args: unknown[]) => {
    warnLogs.push(args);
  };
  console.debug = (...args: unknown[]) => {
    debugLogs.push(args);
    const payload = args[1];
    if (
      args[0] === "[analytics] track (no-op until GTM wired)" &&
      payload &&
      typeof payload === "object" &&
      "name" in payload &&
      "params" in payload
    ) {
      dispatches.push(payload as CapturedDispatch);
    }
  };
}

function restoreMocks() {
  console.warn = originalWarn;
  console.debug = originalDebug;
  if (originalNodeEnv === undefined) {
    Reflect.deleteProperty(mutableEnv, "NODE_ENV");
  } else {
    mutableEnv.NODE_ENV = originalNodeEnv;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function warnText(): string {
  return warnLogs
    .flat()
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join("\n");
}

function run() {
  let passed = 0;
  const tests: Array<{ title: string; fn: () => void }> = [
    {
      title:
        "1. any 캐스팅으로 금지 필드를 넣어도 dispatch params에는 허용 필드만 남는다",
      fn: () => {
        installMocks();
        mutableEnv.NODE_ENV = "development";

        const dirtyParams = {
          relationship_kind: "romantic",
          report_id: "62291b22-760e-420d-b1eb-4cb258beedf0",
          birthDate: "1990-01-15",
          name: "홍길동",
          psych_match: '{"axis_results":[]}',
        };

        const event = {
          name: "report_view",
          params: dirtyParams,
        } as unknown as AnalyticsEvent;

        track(event);

        assert(dispatches.length === 1, "이벤트가 1회 dispatch 됨");
        const dispatched = dispatches[0]!;
        assert(dispatched.name === "report_view", "이벤트 이름 유지");
        assert(
          dispatched.params.relationship_kind === "romantic",
          "relationship_kind만 전달",
        );
        assert(
          !("report_id" in dispatched.params),
          "report_id가 dispatch params에 없음",
        );
        assert(
          !("birthDate" in dispatched.params),
          "birthDate가 dispatch params에 없음",
        );
        assert(!("name" in dispatched.params), "name이 dispatch params에 없음");
        assert(
          !("psych_match" in dispatched.params),
          "psych_match가 dispatch params에 없음",
        );
        assert(
          Object.keys(dispatched.params).length === 1,
          "dispatch params 키는 1개뿐",
        );

        restoreMocks();
        passed++;
      },
    },
    {
      title:
        "2. console.warn에는 제거된 키 이름만 있고 금지 값(PII)은 출력되지 않는다",
      fn: () => {
        installMocks();
        mutableEnv.NODE_ENV = "development";

        const secretReportId = "62291b22-760e-420d-b1eb-4cb258beedf0";
        const secretBirth = "1990-01-15";
        const secretName = "홍길동";

        track({
          name: "report_view",
          params: {
            relationship_kind: "work",
            report_id: secretReportId,
            birthDate: secretBirth,
            name: secretName,
          },
        } as unknown as AnalyticsEvent);

        const text = warnText();
        assert(text.includes("report_id"), "warn에 report_id 키명 포함");
        assert(text.includes("birthDate") || text.includes("birth"), "warn에 birth 관련 키명 포함");
        assert(text.includes("name"), "warn에 name 키명 포함");
        assert(!text.includes(secretReportId), "warn에 report_id 값 미포함");
        assert(!text.includes(secretBirth), "warn에 birthDate 값 미포함");
        assert(!text.includes(secretName), "warn에 name 값 미포함");

        for (const args of warnLogs) {
          assert(args.length <= 1, "warn 인자는 메시지 문자열 1개만");
        }

        restoreMocks();
        passed++;
      },
    },
    {
      title: "3. 필수 키 누락 시 dispatch 없음(빈 이벤트도 전송 안 함)",
      fn: () => {
        installMocks();
        mutableEnv.NODE_ENV = "development";

        track({
          name: "report_view",
          params: {
            report_id: "only-forbidden-no-kind",
          },
        } as unknown as AnalyticsEvent);

        assert(dispatches.length === 0, "report_view: dispatch 0건");
        assert(
          warnText().includes('missing required param "relationship_kind"'),
          "report_view: 필수 키 누락 warn",
        );

        warnLogs.length = 0;
        debugLogs.length = 0;

        track({
          name: "report_share",
          params: {
            relationship_kind: "friendship",
          },
        } as unknown as AnalyticsEvent);

        assert(dispatches.length === 0, "report_share: share_method 없으면 dispatch 0건");
        assert(
          warnText().includes('missing required param "share_method"'),
          "report_share: share_method 누락 warn",
        );

        restoreMocks();
        passed++;
      },
    },
  ];

  console.log("analytics track() runtime guard tests\n");

  for (const t of tests) {
    console.log(`\n${"=".repeat(60)}\n${t.title}\n${"=".repeat(60)}`);
    try {
      t.fn();
      console.log(`\n→ PASS: ${t.title}`);
    } catch (err) {
      restoreMocks();
      console.error(`\n→ FAIL: ${t.title}`);
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`All ${passed}/${tests.length} tests passed`);
}

run();
