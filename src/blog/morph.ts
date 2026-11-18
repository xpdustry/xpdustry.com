import { assignInlineVars } from "@vanilla-extract/dynamic";
import * as morph from "./morph.css";

const asIdentifier = (slug: string) =>
  slug.replace(/[^a-zA-Z0-9-]/gu, (character) => `_${character.codePointAt(0)!.toString(16)}_`);

export const morphsWithItsPost = (slug: string) => {
  const post = asIdentifier(slug);
  return assignInlineVars({
    [morph.card.name]: `post-card-${post}`,
    [morph.title.name]: `post-title-${post}`,
    [morph.topic.name]: `post-topic-${post}`,
    [morph.description.name]: `post-description-${post}`,
    [morph.art.name]: `post-art-${post}`
  });
};
