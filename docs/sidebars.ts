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
        // TODO: Create these documentation files when interfaces are available:
        // 'types/boolean',
        // 'types/mapping',
        // 'types/struct',
      ],
    },
    // TODO: Create examples documentation:
    // {
    //   type: 'category',
    //   label: 'Examples',
    //   items: [
    //     'examples/counter',
    //     'examples/erc20',
    //     'examples/advanced-patterns',
    //   ],
    // },
  ],
};

export default sidebars;
