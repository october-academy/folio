// SPDX-License-Identifier: MIT
import type {
  DividerBlockData,
  EmailBlockData,
  HeadingBlockData,
  ImageBlockData,
  LinkBlockData,
  PhoneBlockData,
  PublicBlock,
  TextBlockData,
  YouTubeBlockData,
} from "@folio/core";
import { DividerBlock, HeadingBlock, TextBlock, YouTubeBlock } from "./block-primitives";
import { LinkBlock } from "./LinkBlock";
import { EmailBlock, ImageBlock, PhoneBlock } from "./tracked-blocks";

export function BlockRenderer({ block, slug }: { block: PublicBlock; slug: string }) {
  switch (block.type) {
    case "link":
      return <LinkBlock id={block.id} slug={slug} data={block.data as LinkBlockData} />;
    case "heading":
      return <HeadingBlock data={block.data as HeadingBlockData} />;
    case "text":
      return <TextBlock data={block.data as TextBlockData} />;
    case "divider":
      return <DividerBlock data={block.data as DividerBlockData} />;
    case "email":
      return <EmailBlock id={block.id} slug={slug} data={block.data as EmailBlockData} />;
    case "phone":
      return <PhoneBlock id={block.id} slug={slug} data={block.data as PhoneBlockData} />;
    case "image":
      return <ImageBlock id={block.id} slug={slug} data={block.data as ImageBlockData} />;
    case "youtube":
      return <YouTubeBlock data={block.data as YouTubeBlockData} />;
    default:
      return null;
  }
}
