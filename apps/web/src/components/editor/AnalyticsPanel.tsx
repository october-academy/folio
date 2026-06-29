"use client";
// SPDX-License-Identifier: MIT

import {
  BarChart3,
  DollarSign,
  ExternalLink,
  MousePointerClick,
  Target,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import type { AlmanacStats } from "@/lib/almanac-util";
import { cn } from "@/lib/utils";
import { type EditorBlock, type LinkStatRow, summarizeStats } from "./editor-helpers";

type BarMetric = "revenue" | "clicks";

/** Rank tracked links by the chosen metric (pure). */
function rankBars(rows: LinkStatRow[], metric: BarMetric): LinkStatRow[] {
  return [...rows].sort((a, b) =>
    metric === "revenue"
      ? b.stats.revenue - a.stats.revenue || b.stats.conversions - a.stats.conversions
      : b.stats.clicks - a.stats.clicks,
  );
}

/**
 * The attribution moat, surfaced: aggregate + per-link clicks→conversions→revenue
 * when Almanac is on; an honest PostHog-funnel pointer when it's off.
 */
export function AnalyticsPanel({
  blocks,
  stats,
  enabled,
}: {
  blocks: EditorBlock[];
  stats: Record<string, AlmanacStats>;
  enabled: boolean | null;
}) {
  const summary = summarizeStats(blocks, stats);
  const [metric, setMetric] = useState<BarMetric>("revenue");
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  const ranked = rankBars(summary.rows, metric);
  const barValue = (r: LinkStatRow) => (metric === "revenue" ? r.stats.revenue : r.stats.clicks);
  const max = Math.max(1, ...ranked.map(barValue));

  return (
    <section className="border-[3px] border-foreground bg-background p-5 shadow-brutal sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
        <TrendingUp className="h-5 w-5" aria-hidden="true" /> 링크 성과
      </h2>

      {enabled && summary.trackedLinks > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard icon={MousePointerClick} label="클릭" value={summary.totals.clicks} />
            <MetricCard icon={UserPlus} label="가입" value={summary.totals.signups} />
            <MetricCard
              icon={Target}
              label="전환"
              value={summary.totals.conversions}
              accent={summary.totals.conversions > 0}
            />
            <MetricCard
              icon={DollarSign}
              label="매출"
              value={`$${summary.totals.revenue.toLocaleString()}`}
              accent={summary.totals.revenue > 0}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              링크 순위
            </p>
            <div className="inline-flex border-[2px] border-foreground">
              {(["revenue", "clicks"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={metric === m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-black uppercase",
                    metric === m
                      ? "bg-accent text-accent-foreground"
                      : "bg-background text-foreground",
                  )}
                >
                  {m === "revenue" ? "매출순" : "클릭순"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {ranked.map((row) => {
              const v = barValue(row);
              const width = v > 0 ? Math.max(6, Math.round((v / max) * 100)) : 0;
              return (
                <div key={row.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold">
                    <span className="truncate">{row.title}</span>
                    <span className="shrink-0 tabular-nums text-accent-ink">
                      {metric === "revenue"
                        ? `$${row.stats.revenue.toLocaleString()}`
                        : `${row.stats.clicks.toLocaleString()} 클릭`}
                    </span>
                  </div>
                  <div
                    className="h-4 border-[2px] border-foreground bg-secondary"
                    role="img"
                    aria-label={`${row.title}: 클릭 ${row.stats.clicks}, 전환 ${row.stats.conversions}, 매출 $${row.stats.revenue}`}
                  >
                    <div
                      className="h-full bg-accent transition-[width]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    클릭 {row.stats.clicks} · 가입 {row.stats.signups} · 전환{" "}
                    {row.stats.conversions}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Almanac click→signup→revenue 원장 기준. 어떤 링크가 유료 고객을 만들었는지 보여줍니다.
          </p>
        </div>
      ) : enabled ? (
        <p className="border-[3px] border-dashed border-foreground bg-secondary px-4 py-6 text-center text-sm text-muted-foreground">
          아직 추적 중인 링크가 없습니다. 링크 블록을 추가하면 Almanac이 자동으로 등록합니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2 border-[3px] border-dashed border-foreground bg-secondary px-4 py-5 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <BarChart3 className="h-4 w-4" aria-hidden="true" /> 클릭·조회는 PostHog에서 확인하세요
          </p>
          <p className="text-muted-foreground">
            <code className="font-mono">folio_link_click</code> /{" "}
            <code className="font-mono">folio_page_view</code> 이벤트로 퍼널을 만드세요. 전환·매출
            귀속(어떤 링크가 결제를 만들었는지)은 <span className="font-bold">Almanac</span> 연동이
            필요합니다 — <code className="font-mono">ALMANAC_URL</code> /{" "}
            <code className="font-mono">ALMANAC_API_KEY</code>를 설정하세요.
          </p>
          {posthogHost ? (
            <a
              href={posthogHost}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1 font-bold text-accent-ink hover:underline"
            >
              PostHog 열기 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof MousePointerClick;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-[3px] border-foreground p-3 shadow-brutal-sm",
        accent ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}
