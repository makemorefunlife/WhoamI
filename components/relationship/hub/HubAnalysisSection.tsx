"use client";



import { ChevronRight } from "lucide-react";

import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";

import HubAnalysisReportRow, {

  HubAnalysisReportRowSkeleton,

} from "@/components/relationship/hub/HubAnalysisReportRow";

import FadeInContent from "@/components/ui/stitch/FadeInContent";

import type { HubAnalysisFeedItem } from "@/lib/relationship/hubAnalysisFeed";



const PREVIEW_LIMIT = 5;



type Props = {

  items: HubAnalysisFeedItem[];

  loading: boolean;

  onOpenLog: (item: HubAnalysisFeedItem) => void;

  onShowMore: () => void;

  totalCount?: number;

};



export default function HubAnalysisSection({

  items,

  loading,

  onOpenLog,

  onShowMore,

  totalCount,

}: Props) {

  const preview = items.slice(0, PREVIEW_LIMIT);

  const showMore =

    (totalCount ?? items.length) > PREVIEW_LIMIT || items.length > PREVIEW_LIMIT;



  return (

    <section className="space-y-4">

      <h2 className="stitch-headline text-lg text-primary">최근 분석</h2>

      <div className={`${hubPanelClass()} divide-y divide-outline-variant/15`}>

        {loading ? (

          <>

            <HubAnalysisReportRowSkeleton />

            <HubAnalysisReportRowSkeleton />

            <HubAnalysisReportRowSkeleton />

          </>

        ) : preview.length === 0 ? (

          <p className="px-5 py-8 text-center text-sm text-on-surface-variant">

            아직 분석 기록이 없어요. 관계 분석하기를 눌러 시작해 보세요.

          </p>

        ) : (

          <FadeInContent>

            <>

              {preview.map((item) => (

                <HubAnalysisReportRow

                  key={item.id}

                  item={item}

                  onOpen={onOpenLog}

                />

              ))}

              {showMore ? (

                <button

                  type="button"

                  onClick={onShowMore}

                  className="flex w-full items-center justify-center gap-1 py-3 text-sm font-semibold text-on-surface-variant transition hover:text-primary"

                >

                  More

                  <ChevronRight className="h-4 w-4" />

                </button>

              ) : null}

            </>

          </FadeInContent>

        )}

      </div>

    </section>

  );

}


