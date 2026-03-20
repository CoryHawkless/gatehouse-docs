import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// ── Hero ─────────────────────────────────────────────────────────────────────

function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <span className={styles.eyebrow}>Identity & Access Management · secuird.tech</span>
        <Heading as="h1" className={styles.title}>
          Secure access,<br />built for your team.
        </Heading>
        <p className={styles.subtitle}>
          Secuird is a modern identity platform — OIDC SSO, MFA enforcement,
          SSH Certificate Authority, and multi-tenant access control.
          Use it at <strong style={{color: 'var(--ifm-color-primary)'}}>secuird.tech</strong> or self-host it.
        </p>
        <div className={styles.cta}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Get started →
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Read the docs
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Pillars ───────────────────────────────────────────────────────────────────

type Pillar = {
  title: string;
  description: string;
  link: string;
};

const PILLARS: Pillar[] = [
  {
    title: 'Authentication & SSO',
    description:
      'Email/password, OAuth (Google, GitHub, Microsoft), TOTP, and WebAuthn passkeys out of the box. Acts as a full OIDC provider for any downstream app.',
    link: '/docs/core-concepts/authentication',
  },
  {
    title: 'MFA & Policy Enforcement',
    description:
      'Require TOTP or passkeys at the org level with configurable grace periods. Non-compliant members are suspended automatically.',
    link: '/docs/core-concepts/mfa-policies',
  },
  {
    title: 'SSH Certificate Authority',
    description:
      'Issue short-lived user and host certificates against org-managed CAs. Principal-based access, CRL support, and a full audit trail.',
    link: '/docs/integrations/ssh-ca',
  },
];

function Pillars() {
  return (
    <section className={styles.pillars}>
      <div className="container">
        <div className={styles.pillarsGrid}>
          {PILLARS.map((p) => (
            <Link key={p.title} to={p.link} className={styles.pillarCard}>
              <span className={styles.pillarDot} />
              <Heading as="h3" className={styles.pillarTitle}>{p.title}</Heading>
              <p className={styles.pillarDesc}>{p.description}</p>
              <span className={styles.pillarLink}>Learn more →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Quick-start strip ─────────────────────────────────────────────────────────

function QuickStart() {
  return (
    <section className={styles.quickstart}>
      <div className="container">
        <div className={styles.quickstartInner}>
          <div className={styles.quickstartText}>
            <Heading as="h2" className={styles.quickstartHeading}>
              Up and running in minutes
            </Heading>
            <p className={styles.quickstartSub}>
              Sign up at <strong style={{color: 'var(--ifm-color-primary)'}}>secuird.tech</strong>, create an organization,
              invite your team, and configure access policies — no install
              required.
            </p>
            <div className={styles.quickstartActions}>
              <Link className="button button--primary" to="/docs/getting-started">
                Getting started guide →
              </Link>
              <Link className="button button--secondary" to="/docs/getting-started/quickstart">
                Self-hosting
              </Link>
            </div>
          </div>
          <div className={styles.steps}>
            {[
              ['1', 'Sign up', 'Create a free account at secuird.tech'],
              ['2', 'Create an org', 'Set up your organization and invite your team'],
              ['3', 'Configure access', 'Define departments, principals, MFA policies, and SSH CAs'],
            ].map(([num, title, desc]) => (
              <div key={num} className={styles.step}>
                <span className={styles.stepNum}>{num}</span>
                <div>
                  <strong className={styles.stepTitle}>{title}</strong>
                  <p className={styles.stepDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home(): ReactNode {
  return (
    <Layout
      title="Open-source Identity & Access Management"
      description="Self-hosted auth platform — OIDC SSO, MFA enforcement, SSH CA, and multi-tenant access control.">
      <HomepageHeader />
      <main>
        <Pillars />
        <QuickStart />
      </main>
    </Layout>
  );
}
