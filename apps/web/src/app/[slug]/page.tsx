// SPDX-License-Identifier: MIT
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolioView } from "@/components/FolioView";
import { loadPublicPage } from "@/lib/public-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPublicPage(slug);
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  return {
    title: page.display_name,
    description: page.description || undefined,
    alternates: { canonical: page.page_url },
    openGraph: {
      title: page.display_name,
      description: page.description || undefined,
      url: page.page_url,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: page.display_name,
      description: page.description || undefined,
    },
  };
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadPublicPage(slug);
  if (!page) notFound();
  return <FolioView page={page} />;
}
