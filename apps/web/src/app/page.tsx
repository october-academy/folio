import { FolioView } from "@/components/FolioView";
import { getOwnerId } from "@/lib/cf";
import { getOwnerPage } from "@/lib/db";
import { loadPublicPage } from "@/lib/public-page";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function loadOwnerPublicPage() {
  const owner = await getOwnerPage(getOwnerId());
  if (!owner) return null;
  return loadPublicPage(owner.slug);
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadOwnerPublicPage();
  if (!page) return { title: "Folio" };
  return {
    title: page.display_name,
    description: page.description || undefined,
    openGraph: {
      title: page.display_name,
      description: page.description || undefined,
      url: page.page_url,
      type: "profile",
      images: [{ url: page.og_image_url, width: 1200, height: 630 }],
    },
  };
}

function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="max-w-md border-[4px] border-foreground bg-background p-8 text-center shadow-brutal">
        <h1 className="text-2xl font-black">Folio가 준비됐어요</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          아직 페이지가 설정되지 않았습니다. 관리자 토큰으로 편집기에 들어가 첫 Folio를 만들어
          보세요.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex border-[3px] border-foreground bg-accent px-5 py-3 font-black text-accent-foreground shadow-brutal hover:-translate-y-0.5"
        >
          편집기 열기 →
        </Link>
      </div>
    </main>
  );
}

export default async function Home() {
  const page = await loadOwnerPublicPage();
  if (!page) return <SetupNotice />;
  return <FolioView page={page} />;
}
