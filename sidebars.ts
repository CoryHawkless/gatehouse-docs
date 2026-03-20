import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'doc',
      id: 'intro/intro',
      label: 'Welcome',
    },
    {
      type: 'category',
      label: 'Introduction',
      collapsed: false,
      items: [
        'intro/what-is-secuird',
        'intro/key-concepts',
        'intro/how-it-works',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/getting-started',
        'getting-started/joining-an-organization',
        'getting-started/creating-an-organization',
        'getting-started/setting-up-cas',
        'getting-started/managing-your-team',
        'getting-started/ssh-keys-and-certificates',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'core-concepts/authentication',
        'core-concepts/organizations',
        'core-concepts/mfa-policies',
        'core-concepts/sessions',
        'core-concepts/audit-logs',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/oidc-provider',
        'integrations/oauth-social',
        'integrations/ssh-ca',
        'integrations/cli',
      ],
    },
    {
      type: 'category',
      label: 'Self-Hosting',
      collapsed: true,
      items: [
        'deployment/self-hosting',
        'getting-started/quickstart',
        'getting-started/installation',
        'getting-started/configuration',
      ],
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api-reference/overview',
        'api-reference/auth',
        'api-reference/users',
        'api-reference/organizations',
      ],
    },
  ],
};

export default sidebars;
