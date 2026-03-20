import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Secuird',
  tagline: 'Open-source identity & access management — authentication, OIDC provider, SSH CA, and MFA in one platform.',
  favicon: 'img/secuird-favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.Secuird.dev',
  baseUrl: '/',

  organizationName: 'Secuird',
  projectName: 'Secuird',

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/Secuird-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'beta',
      content: '🔐 Secuird is in active development. Star us on <a href="https://github.com/CoryHawkless/gatehouse-api.git">GitHub</a>!',
      backgroundColor: '#1e293b',
      textColor: '#94a3b8',
      isCloseable: true,
    },
    navbar: {
      title: 'Secuird',
      logo: {
        alt: 'Secuird Logo',
        src: 'img/secuird-logo.svg',
        srcDark: 'img/secuird-logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/CoryHawkless/gatehouse-api.git',
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
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Configuration', to: '/docs/getting-started/configuration' },
          ],
        },
        {
          title: 'Features',
          items: [
            { label: 'Authentication', to: '/docs/core-concepts/authentication' },
            { label: 'Organizations', to: '/docs/core-concepts/organizations' },
            { label: 'OIDC Provider', to: '/docs/integrations/oidc-provider' },
            { label: 'SSH CA', to: '/docs/integrations/ssh-ca' },
          ],
        },
        {
          title: 'API Reference',
          items: [
            { label: 'Overview', to: '/docs/api-reference/overview' },
            { label: 'Authentication', to: '/docs/api-reference/auth' },
            { label: 'Organizations', to: '/docs/api-reference/organizations' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/CoryHawkless/gatehouse-api.git' },
            { label: 'Self-Hosting', to: '/docs/getting-started/quickstart' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Secuird. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'python', 'json', 'nginx'],
    },
    algolia: undefined,
  } satisfies Preset.ThemeConfig,
};

export default config;
