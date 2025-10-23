import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { LatexBlock } from './blocks/LatexBlock';
import { YouTubeBlock } from './blocks/YouTubeBlock';

// Create custom schema with LaTeX and YouTube blocks
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    latex: LatexBlock(),
    youtube: YouTubeBlock(),
  },
});

// Export the schema type for use in components
export type CustomSchema = typeof customSchema;
