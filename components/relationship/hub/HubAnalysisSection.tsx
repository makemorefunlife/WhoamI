"use client";



import { ChevronRight } from "lucide-react";

import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";

import HubAnalysisReportRow, {

  HubAnalysisReportRowSkeleton,

} from "@/components/relationship/hub/HubAnalysisReportRow";

import FadeInContent from "@/components/ui/stitch/FadeInContent";

import type { HubAnalysisFeedItem } from "@/lib/relationship/hubAnalysisFeed";

import { useMessages } from "@/lib/i18n/LocaleProvider";



const PREVIEW_LIMIT = 3;



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

  const messages = useMessages();

  const preview = items.slice(0, PREVIEW_LIMIT);

  const showMore =

    (totalCount ?? items.length) > PREVIEW_LIMIT || items.length > PREVIEW_LIMIT;



  return (

    <section className="space-y-4">

      <div className={`${hubPanelClass()} divide-y divide-outline-variant/15`}>

        {loading ? (

          <>

            <HubAnalysisReportRowSkeleton />

            <HubAnalysisReportRowSkeleton />

            <HubAnalysisReportRowSkeleton />

          </>

        ) : preview.length === 0 ? (

          <p className="px-5 py-8 text-center text-sm text-on-surface-variant">

            {messages.hub.noAnalysisYetHint}

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

                  {messages.hub.more}

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


