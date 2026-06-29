"use client";
// SPDX-License-Identifier: MIT

import { BarChart3, ExternalLink, TrendingUp } from "lucide-react";
import type { AlmanacStats } from "@/lib/almanac-util";
import { type EditorBlock, summarizeStats } from "./editor-helpers";

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
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  return (
    <section className="border-[3px] border-foreground bg-background p-5 shadow-brutal-sm">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
        <TrendingUp className="h-5 w-5" /> 링크 성과
      </h2>

      {enabled && summary.trackedLinks > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="클릭" value={summary.totals.clicks} />
            <Stat label="가입" value={summary.totals.signups} />
            <Stat label="전환" value={summary.totals.conversions} accent />
            <Stat label="매출" value={`$${summary.totals.revenue.toLocaleString()}`} accent />
          </div>
          <div className="overflow-hidden border-[3px] border-foreground">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-xs font-black uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">링크</th>
                  <th className="px-2 py-2 text-right">클릭</th>
                  <th className="px-2 py-2 text-right">전환</th>
                  <th className="px-3 py-2 text-right">매출</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr key={row.id} className="border-t-[3px] border-foreground">
                    <td className="max-w-[160px] truncate px-3 py-2 font-bold">{row.title}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.stats.clicks}</td>
                    <td className="px-2 py-2 text-right font-black tabular-nums">
                      {row.stats.conversions}
                    </td>
                    <td className="px-3 py-2 text-right font-black tabular-nums">
                      {row.stats.revenue > 0 ? `$${row.stats.revenue.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <BarChart3 className="h-4 w-4" /> 클릭·조회는 PostHog에서 확인하세요
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
              className="inline-flex w-fit items-center gap-1 font-bold text-accent hover:underline"
            >
              PostHog 열기 <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border-[3px] border-foreground px-3 py-2 ${
        accent ? "bg-accent text-accent-foreground" : "bg-secondary"
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-lg font-black tabular-nums">{value}</div>
    </div>
  );
}
