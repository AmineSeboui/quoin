import type { QuoinBlock } from 'quoin-editor';

export const seedBlocks: QuoinBlock[] = [
  {
    id: 'seed-intro',
    type: 'MARKDOWN',
    data: {
      markdown: [
        '# Write in blocks, think in documents',
        '',
        'Quoin is a block editor for React. **Click any block** to edit it, press `/` on an empty line to insert something new, and grab the handle on the left to drag a block somewhere else.',
        '',
        '- Typed blocks instead of one big string',
        '- A markdown surface with shortcuts and list continuation',
        '- An open registry, so your own block types sit beside the built-in ones',
      ].join('\n'),
    },
  },
  {
    id: 'seed-callout',
    type: 'CALLOUT',
    data: {
      tone: 'tip',
      body: 'Press / and choose Bookmark. It is a block type registered by this page with defineBlock, and the code is further down.',
    },
  },
  {
    id: 'seed-code',
    type: 'CODE',
    data: {
      language: 'tsx',
      code: "<BlockCanvas blocks={blocks} onChange={setBlocks} />",
    },
  },
  {
    id: 'seed-bookmark',
    type: 'BOOKMARK',
    data: { url: 'https://www.npmjs.com/package/quoin-editor', title: 'quoin-editor on npm' },
  },
];
