"use client";
// SPDX-License-Identifier: MIT

import { detectBrand } from "@folio/buttons";
import type { BlockType } from "@folio/core";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  BLOCK_TYPE_OPTIONS,
  BRAND_OPTIONS,
  blockTypeLabel,
  createDraftBlock,
  type EditorBlock,
  reorderBlocks,
  type SocialDraft,
} from "./editor-helpers";
import { LivePreview } from "./LivePreview";

const TOKEN_KEY = "folio_admin_token";

export function FolioEditor() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("auto");
  const [socials, setSocials] = useState<SocialDraft[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [newBlockType, setNewBlockType] = useState<BlockType>("link");
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setReady(true);
  }, []);

  const authFetch = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
          ...(init.headers ?? {}),
        },
      }),
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setAuthError(false);
    try {
      const res = await authFetch("/api/folio");
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      if (!res.ok) throw new Error("불러오기에 실패했습니다.");
      const data = (await res.json()) as {
        page: {
          id: string;
          slug: string;
          display_name: string;
          avatar_url: string | null;
          description: string | null;
          theme: string;
          socials: SocialDraft[];
        };
        blocks: Array<{
          id: string;
          type: BlockType;
          position: number;
          is_visible: boolean;
          data: Record<string, unknown>;
        }>;
        public_url: string;
      };
      setSlug(data.page.slug);
      setSlugDraft(data.page.slug);
      setDisplayName(data.page.display_name ?? "");
      setAvatarUrl(data.page.avatar_url ?? "");
      setDescription(data.page.description ?? "");
      setTheme(data.page.theme ?? "auto");
      setSocials(Array.isArray(data.page.socials) ? data.page.socials : []);
      setBlocks(
        (data.blocks ?? [])
          .map((b) => ({
            id: b.id,
            type: b.type,
            position: b.position,
            is_visible: b.is_visible,
            data: b.data ?? {},
          }))
          .sort((a, b) => a.position - b.position),
      );
      setPublicUrl(data.public_url ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  function saveTokenValue() {
    const t = tokenInput.trim();
    if (!t) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setTokenInput("");
    setAuthError(false);
  }
  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthError(false);
  }

  const flash = (msg: string) => {
    setMessage(msg);
    setError(null);
    setTimeout(() => setMessage((m) => (m === msg ? null : m)), 2500);
  };

  async function saveProfile() {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch("/api/folio/settings", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
          description: description.trim() || null,
          theme,
          socials: socials
            .filter((s) => s.url.trim() && s.brand.trim())
            .map((s) => ({ brand: s.brand.trim(), url: s.url.trim() })),
        }),
      });
      if (!res.ok) throw new Error((await errorOf(res)) ?? "프로필 저장 실패");
      flash("프로필을 저장했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function saveSlug() {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch("/api/folio/slug", {
        method: "PUT",
        body: JSON.stringify({ slug: slugDraft.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error((await errorOf(res)) ?? "슬러그 변경 실패");
      setSlug(slugDraft.trim().toLowerCase());
      await load();
      flash("슬러그를 변경했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "슬러그 변경 실패");
    } finally {
      setSaving(false);
    }
  }

  function addBlock() {
    setBlocks((cur) => [...cur, { ...createDraftBlock(newBlockType), position: cur.length }]);
  }

  function updateBlock(id: string, patch: Partial<EditorBlock>) {
    setBlocks((cur) => cur.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function updateBlockData(id: string, dataPatch: Record<string, unknown>) {
    setBlocks((cur) =>
      cur.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...dataPatch } } : b)),
    );
  }

  async function persistBlock(block: EditorBlock) {
    setBusyBlockId(block.id);
    setError(null);
    try {
      const isDraft = block.isDraft || block.id.startsWith("draft-");
      const res = await authFetch(isDraft ? "/api/folio/blocks" : `/api/folio/blocks/${block.id}`, {
        method: isDraft ? "POST" : "PUT",
        body: JSON.stringify({
          type: block.type,
          position: block.position,
          is_visible: block.is_visible,
          data: block.data,
        }),
      });
      if (!res.ok) throw new Error((await errorOf(res)) ?? "블록 저장 실패");
      await load();
      flash(`${blockTypeLabel(block.type)} 블록을 저장했습니다.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "블록 저장 실패");
    } finally {
      setBusyBlockId(null);
    }
  }

  async function removeBlock(id: string) {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    if (block.isDraft) {
      setBlocks((cur) => cur.filter((b) => b.id !== id));
      return;
    }
    setBusyBlockId(id);
    try {
      const res = await authFetch(`/api/folio/blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await errorOf(res)) ?? "삭제 실패");
      setBlocks((cur) => cur.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i })));
      flash("블록을 삭제했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusyBlockId(null);
    }
  }

  async function persistReorder(next: EditorBlock[]) {
    const saved = next.filter((b) => !b.isDraft);
    if (saved.length === 0) return;
    try {
      await authFetch("/api/folio/blocks/reorder", {
        method: "PUT",
        body: JSON.stringify({
          blocks: saved.map((b) => ({ id: b.id, position: b.position })),
        }),
      });
    } catch {
      // non-fatal; local order already updated
    }
  }

  async function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(idx, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    const renum = next.map((b, i) => ({ ...b, position: i }));
    setBlocks(renum);
    await persistReorder(renum);
  }

  function copyPublicUrl() {
    void navigator.clipboard.writeText(publicUrl || `/@${slug}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // --- render ---------------------------------------------------------------

  if (!ready) return null;

  if (!token || authError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="w-full border-[4px] border-foreground bg-background p-6 shadow-brutal">
          <h1 className="text-2xl font-black">Folio 편집기</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {authError
              ? "토큰이 올바르지 않습니다. 다시 입력해 주세요."
              : "FOLIO_ADMIN_TOKEN을 입력해 편집기에 로그인하세요."}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              data-testid="token-input"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveTokenValue()}
              placeholder="admin token"
            />
            <Button data-testid="token-submit" onClick={saveTokenValue}>
              편집기 열기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Folio 편집기</h1>
          <button
            type="button"
            onClick={copyPublicUrl}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {publicUrl || `/@${slug}`}
          </button>
        </div>
        <Button variant="outline" onClick={signOut}>
          로그아웃
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border-[3px] border-foreground bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-brutal-sm">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 border-[3px] border-foreground bg-background px-4 py-2 text-sm font-bold shadow-brutal-sm">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            {/* Profile */}
            <section className="border-[3px] border-foreground bg-background p-5 shadow-brutal-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">프로필</h2>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} 저장
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                <Field label="표시 이름">
                  <Input
                    value={displayName}
                    maxLength={80}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="이름 또는 닉네임"
                  />
                </Field>
                <Field label="아바타 URL">
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="한 줄 소개">
                  <Textarea
                    value={description}
                    maxLength={240}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px]"
                    placeholder="방문자에게 보여줄 소개"
                  />
                </Field>
                <Field label="테마">
                  <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="auto">자동 (시스템)</option>
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                  </Select>
                </Field>
                <SocialsEditor socials={socials} setSocials={setSocials} />
              </div>
            </section>

            {/* Slug */}
            <section className="border-[3px] border-foreground bg-background p-5 shadow-brutal-sm">
              <h2 className="mb-3 text-xl font-black">슬러그</h2>
              <div className="flex gap-3">
                <Input
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                  className="font-mono"
                  placeholder="your-slug"
                />
                <Button onClick={saveSlug} disabled={saving || !slugDraft.trim()}>
                  저장
                </Button>
              </div>
            </section>

            {/* Blocks */}
            <section className="border-[3px] border-foreground bg-background p-5 shadow-brutal-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">블록</h2>
                <div className="flex gap-2">
                  <Select
                    data-testid="new-block-type"
                    value={newBlockType}
                    onChange={(e) => setNewBlockType(e.target.value as BlockType)}
                  >
                    {BLOCK_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  <Button data-testid="add-block" onClick={addBlock}>
                    <Plus className="h-4 w-4" /> 추가
                  </Button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <p className="border-[3px] border-dashed border-foreground bg-secondary px-4 py-10 text-center text-sm text-muted-foreground">
                  첫 블록을 추가해보세요.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {blocks.map((block, index) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      index={index}
                      total={blocks.length}
                      busy={busyBlockId === block.id}
                      onUpdate={updateBlock}
                      onUpdateData={updateBlockData}
                      onPersist={persistBlock}
                      onRemove={removeBlock}
                      onMove={moveBlock}
                      onDragStart={() => setDraggingId(block.id)}
                      onDrop={async () => {
                        if (!draggingId || draggingId === block.id) return;
                        const next = reorderBlocks(blocks, draggingId, block.id);
                        setBlocks(next);
                        setDraggingId(null);
                        await persistReorder(next);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <LivePreview
            displayName={displayName}
            slug={slugDraft || slug}
            description={description}
            avatarUrl={avatarUrl}
            theme={theme}
            socials={socials}
            blocks={blocks}
          />
        </div>
      )}
    </div>
  );
}

async function errorOf(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? null;
  } catch {
    return null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SocialsEditor({
  socials,
  setSocials,
}: {
  socials: SocialDraft[];
  setSocials: (next: SocialDraft[]) => void;
}) {
  const update = (i: number, patch: Partial<SocialDraft>) =>
    setSocials(socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
          소셜 링크 (최대 6)
        </span>
        <Button
          variant="outline"
          onClick={() => socials.length < 6 && setSocials([...socials, { brand: "", url: "" }])}
          disabled={socials.length >= 6}
        >
          <Plus className="h-3.5 w-3.5" /> 추가
        </Button>
      </div>
      {socials.map((s, i) => (
        <div key={i} className="grid grid-cols-[140px_minmax(0,1fr)_auto] gap-2">
          <Select value={s.brand} onChange={(e) => update(i, { brand: e.target.value })}>
            <option value="">브랜드</option>
            {BRAND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            value={s.url}
            onChange={(e) => {
              const url = e.target.value;
              const detected = !s.brand ? detectBrand(url) : undefined;
              update(i, detected ? { url, brand: detected } : { url });
            }}
            placeholder="https://..."
          />
          <Button
            variant="outline"
            onClick={() => setSocials(socials.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  busy,
  onUpdate,
  onUpdateData,
  onPersist,
  onRemove,
  onMove,
  onDragStart,
  onDrop,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  busy: boolean;
  onUpdate: (id: string, patch: Partial<EditorBlock>) => void;
  onUpdateData: (id: string, patch: Record<string, unknown>) => void;
  onPersist: (block: EditorBlock) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const d = block.data;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="border-[3px] border-foreground bg-secondary p-3 shadow-brutal-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
            #{index + 1} {blockTypeLabel(block.type)} {block.isDraft ? "· 새 블록" : ""}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => onUpdate(block.id, { is_visible: !block.is_visible })}
          >
            {block.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => onMove(block.id, -1)} disabled={index === 0}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onMove(block.id, 1)}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button data-testid="block-save" onClick={() => onPersist(block)} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} 저장
          </Button>
          <Button variant="outline" onClick={() => onRemove(block.id)} disabled={busy}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {block.type === "link" ? (
        <div className="flex flex-col gap-2">
          <Input
            data-testid="block-url"
            value={String(d.url ?? "")}
            onChange={(e) => {
              const url = e.target.value;
              const detected = !d.brand ? detectBrand(url) : undefined;
              onUpdateData(block.id, detected ? { url, brand: detected } : { url });
            }}
            placeholder="https://example.com"
          />
          <Input
            data-testid="block-title"
            value={String(d.title ?? "")}
            onChange={(e) => onUpdateData(block.id, { title: e.target.value })}
            placeholder="링크 제목"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select
              value={String(d.brand ?? "")}
              onChange={(e) => onUpdateData(block.id, { brand: e.target.value })}
            >
              <option value="">브랜드 자동/없음</option>
              {BRAND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 border-[3px] border-foreground bg-background px-3 text-xs font-bold">
              <input
                type="checkbox"
                checked={Boolean(d.highlight)}
                onChange={(e) => onUpdateData(block.id, { highlight: e.target.checked })}
              />
              강조
            </label>
          </div>
          <Textarea
            value={String(d.description ?? "")}
            onChange={(e) => onUpdateData(block.id, { description: e.target.value })}
            placeholder="설명 (선택)"
          />
        </div>
      ) : null}

      {block.type === "heading" ? (
        <Input
          value={String(d.text ?? "")}
          onChange={(e) => onUpdateData(block.id, { text: e.target.value })}
          placeholder="섹션 헤딩"
        />
      ) : null}

      {block.type === "text" ? (
        <Textarea
          value={String(d.text ?? "")}
          onChange={(e) => onUpdateData(block.id, { text: e.target.value })}
          placeholder="텍스트 내용"
          className="min-h-[80px]"
        />
      ) : null}

      {block.type === "divider" ? (
        <Select
          value={String(d.size ?? "md")}
          onChange={(e) => onUpdateData(block.id, { size: e.target.value })}
          className={cn("w-full")}
        >
          <option value="sm">좁게</option>
          <option value="md">보통</option>
          <option value="lg">넓게</option>
        </Select>
      ) : null}
    </div>
  );
}
