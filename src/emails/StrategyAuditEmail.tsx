import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface StrategyAuditEmailProps {
  name: string;
  email: string;
  company: string;
  challenge: string;
}

export const StrategyAuditEmail = ({
  name = 'John Doe',
  email = 'john@example.com',
  company = 'Acme Inc',
  challenge = 'We need help scaling our product.',
}: StrategyAuditEmailProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || process.env.CLOUDINARY_LOGO_URL || 'https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png';

  return (
    <Html>
      <Head />
      <Preview>New Strategy Audit Request from {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="280" alt="LAUNCHPAD" style={logo} />
            <div style={separator}></div>
            <Text style={subtitle}>by Masterminds</Text>
          </Section>

          <Section style={card}>
            <div style={badgeContainer}>
              <span style={badge}>📋 New Strategy Audit Request</span>
            </div>
            
            <Text style={paragraph}>
              A new strategy audit request has been submitted through the landing page:
            </Text>

            <Section style={detailsTable}>
              <div style={detailRow}>
                <Text style={label}>Name</Text>
                <Text style={value}>{name}</Text>
              </div>
              <div style={detailRow}>
                <Text style={label}>Corporate Email</Text>
                <Text style={value}>{email}</Text>
              </div>
              <div style={detailRow}>
                <Text style={label}>Company</Text>
                <Text style={value}>{company}</Text>
              </div>
            </Section>

            <Section style={challengeBox}>
              <Text style={challengeLabel}>Main Challenge</Text>
              <Text style={challengeText}>{challenge}</Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>© 2026 LAUNCHPAD · by Masterminds</Text>
            <Text style={footerNote}>This is an automated system message.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default StrategyAuditEmail;

export const theme = {
  canvas: '#131314',
  elevated: '#1c1b1c',
  ink: '#e5e2e3',
  body: '#c2c6d9',
  muted: '#8c90a2',
  mutedSoft: '#64748b',
  hairline: '#424656',
  primary: '#0062ff',
  secondary: '#a855f7',
  font: "'Inter', 'Segoe UI', Arial, sans-serif",
};

export const main = {
  backgroundColor: theme.canvas,
  fontFamily: theme.font,
  color: theme.ink,
  padding: '40px 16px',
};

export const container = {
  margin: '0 auto',
  maxWidth: '600px',
  width: '100%',
};

export const header = {
  textAlign: 'center' as const,
  paddingBottom: '24px',
};

export const logo = {
  display: 'block',
  margin: '0 auto',
  maxWidth: '100%',
  height: 'auto',
};

export const separator = {
  width: '32px',
  height: '2px',
  backgroundColor: theme.secondary,
  margin: '8px auto',
};

export const subtitle = {
  fontSize: '9px',
  textTransform: 'uppercase' as const,
  letterSpacing: '3px',
  color: theme.muted,
  fontWeight: '600',
  margin: '0',
};

export const card = {
  backgroundColor: theme.elevated,
  border: `1px solid ${theme.hairline}`,
  padding: '32px',
  borderRadius: '8px',
};

export const badgeContainer = {
  marginBottom: '20px',
};

export const badge = {
  backgroundColor: 'rgba(168,85,247,0.1)',
  color: theme.secondary,
  fontSize: '10px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  padding: '4px 10px',
  border: '1px solid rgba(168,85,247,0.2)',
  borderRadius: '4px',
};

export const paragraph = {
  color: theme.body,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

export const detailsTable = {
  width: '100%',
};

export const detailRow = {
  padding: '12px 0',
  borderBottom: `1px solid ${theme.hairline}`,
};

export const label = {
  color: theme.muted,
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontWeight: '700',
  margin: '0',
};

export const value = {
  color: theme.ink,
  fontSize: '14px',
  fontWeight: '600',
  margin: '4px 0 0 0',
};

export const challengeBox = {
  backgroundColor: theme.canvas,
  border: `1px solid ${theme.hairline}`,
  padding: '20px',
  marginTop: '16px',
  borderRadius: '4px',
};

export const challengeLabel = {
  color: theme.muted,
  fontSize: '9px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

export const challengeText = {
  color: theme.body,
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

export const footer = {
  padding: '24px 0 0 0',
  textAlign: 'center' as const,
};

export const footerText = {
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: theme.muted,
  fontWeight: '600',
  margin: '0',
};

export const footerNote = {
  fontSize: '9px',
  color: theme.mutedSoft,
  margin: '6px 0 0 0',
};
