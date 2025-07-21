import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'getting-started',
    {
      type: 'category',
      label: 'Decorators',
      items: [
        'decorators/contract',
        'decorators/external',
        'decorators/view',
        'decorators/event',
        'decorators/error',
        'decorators/visibility',
      ],
    },
    {
      type: 'category',
      label: 'Data Types',
      items: [
        'types/u256',
        'types/i256',
        'types/address',
        'types/string',
        'types/boolean',
      ],
    },
    {
      type: 'category',
      label: 'Data Structures',
      items: [
        'structures/mapping',
        'structures/mapping2',
        'structures/struct',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/erc20',
        'examples/erc721',
      ],
    },
  ],
};

export default sidebars;
