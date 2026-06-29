// SPDX-License-Identifier: MIT
/**
 * Storage row types (D1) and the public-page view types shared by the
 * repository and the renderers.
 */
import type { BlockData, BlockType } from "./blocks";
import type { Social, Theme } from "./page";

/** A row in the D1 `pages` table. JSON columns are stored as TEXT. */
export type FolioPageRow = {
  id: string;
  slug: string;
  owner_id: string | null;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  socials: string; // json: Social[]
  theme: string; // auto|light|dark|<custom>
  settings: string; // json
  is_published: number; // 0|1
  created_at: number | null;
  updated_at: number | null;
};

/** A user (v1.0 multi-user). Owns one Folio page via `owner_id = user.id`. */
export type FolioUserRole = "admin" | "user";

export type FolioUserRow = {
  id: string;
  email: string;
  role: string;
  created_at: number | null;
};

export type FolioUser = {
  id: string;
  email: string;
  role: FolioUserRole;
  created_at: number | null;
};

/** A row in the D1 `blocks` table. */
export type FolioBlockRow = {
  id: string;
  page_id: string;
  type: string;
  position: number;
  is_visible: number; // 0|1
  pinned: number; // 0|1
  data: string; // json: BlockData
  created_at: number | null;
  updated_at: number | null;
};

/** A page as edited in the admin UI / returned by the "get" API (parsed). */
export type FolioPage = {
  id: string;
  slug: string;
  owner_id: string | null;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  socials: Social[];
  theme: Theme;
  settings: Record<string, unknown>;
  is_published: boolean;
  created_at: number | null;
  updated_at: number | null;
};

/** A parsed block (used by the editor and public renderers). */
export type FolioBlock = {
  id: string;
  page_id: string;
  type: BlockType;
  position: number;
  is_visible: boolean;
  pinned: boolean;
  data: BlockData;
  created_at: number | null;
  updated_at: number | null;
};

/** A block as rendered on the public page (no storage fields). */
export type PublicBlock = {
  id: string;
  type: BlockType;
  data: BlockData;
};

/** Everything the public `/@slug` page (and OG image) needs. */
export type PublicFolioPage = {
  slug: string;
  display_name: string;
  description: string;
  avatar_url: string | null;
  theme: Theme;
  socials: Social[];
  blocks: PublicBlock[];
  page_url: string;
  og_image_url: string;
};
