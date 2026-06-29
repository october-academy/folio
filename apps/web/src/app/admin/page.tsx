// SPDX-License-Identifier: MIT
import type { Metadata } from "next";
import { FolioEditor } from "@/components/editor/FolioEditor";

export const metadata: Metadata = {
  title: "편집기",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-secondary">
      <FolioEditor />
    </main>
  );
}
