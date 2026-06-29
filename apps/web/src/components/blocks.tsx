import type {
  DividerBlockData,
  HeadingBlockData,
  LinkBlockData,
  PublicBlock,
  TextBlockData,
} from "@folio/core";
import { DividerBlock, HeadingBlock, TextBlock } from "./block-primitives";
import { LinkBlock } from "./LinkBlock";

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
    default:
      return null;
  }
}
