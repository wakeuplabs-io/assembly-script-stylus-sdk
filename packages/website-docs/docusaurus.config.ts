import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'AssemblyScript Stylus SDK',
  tagline: 'Smart Contract Development for Arbitrum Stylus using AssemblyScript',
  favicon: 'img/arbitrum_stylus_icon.svg',

  // Future flags for Docusaurus v4 compatibility
  future: {
    v4: true,
  },

  url: 'https://assemblyscript-stylus-sdk.wakeuplabs.io',
  baseUrl: '/',

  organizationName: 'wakeuplabs-io',
  projectName: 'assembly-script-stylus-sdk',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/wakeuplabs-io/assembly-script-stylus-sdk/tree/main/docs/',
          routeBasePath: '/', // Serve docs at root
        },
        blog: false, // Disabled as requested
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'AS-Stylus SDK',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/wakeuplabs-io/assembly-script-stylus-sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started',
            },
            {
              label: 'Decorators',
              to: '/decorators/contract',
            },
            {
              label: 'Data Types',
              to: '/types/u256',
            },
            {
              label: 'Data Structures',
              to: '/structures/mapping',
            },
            {
              label: 'Examples',
              to: '/examples/erc20',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/wakeuplabs-io/assembly-script-stylus-sdk',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AssemblyScript Stylus SDK Contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
