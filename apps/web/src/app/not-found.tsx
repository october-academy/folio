// SPDX-License-Identifier: MIT
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="max-w-md border-[4px] border-foreground bg-background p-8 text-center shadow-brutal">
        <p className="text-5xl font-black text-accent">404</p>
        <h1 className="mt-3 text-xl font-black">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">존재하지 않거나 비공개된 Folio입니다.</p>
        <Link
          href="/"
          className="mt-6 inline-flex border-[3px] border-foreground bg-background px-5 py-3 font-black shadow-brutal hover:-translate-y-0.5"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
