import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface PitchInvitationEmailProps {
  recipientName?: string;
  introMessage?: string;
  pitchTitle: string;
  pitchSubtitle?: string;
  clientName?: string;
  clientTag?: string;
  tagline?: string;
  pillarsLabel?: string;
  pitchUrl: string;
  accentColor?: string;
  buttonText?: string;
  linkText?: string;
  badgeText?: string;
  keyPillars?: Array<{ title: string; subtitle?: string }>;
  senderName?: string;
  senderRole?: string;
  senderEmail?: string;
  locale?: string;
  brandName?: string;
}

export const PitchInvitationEmail = ({
  recipientName,
  introMessage = 'Es un placer compartir contigo la propuesta estratégica y plan de ejecución que hemos desarrollado especialmente para su ecosistema digital.\n\nPueden acceder a la presentación interactiva y caso de estudio completo a través de la tarjeta a continuación.',
  pitchTitle = 'DiDi Food Growth & Digital Ecosystem',
  pitchSubtitle = '2026 Daily Comms & Major Event Production',
  clientName = 'DiDi',
  clientTag,
  tagline,
  pillarsLabel,
  badgeText,
  pitchUrl = `${(process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_ORIGIN || '').replace(/\/+$/, '')}`,
  accentColor = '#FF7D00',
  buttonText,
  linkText,
  keyPillars = [
    { title: 'Creative Assets & Digital Design', subtitle: 'D-Channel, D-Hub & Email' },
    { title: 'Video & Motion Graphics', subtitle: 'Shooting, Editing & 2D/3D Motion' },
    { title: 'Executive Slides & Data Viz', subtitle: 'Presentations & Infographics' },
  ],
  senderName = 'Eduardo Marval',
  senderRole = 'Lead Solution Architect',
  senderEmail = 'e.marval@themarvals.com',
  locale = 'es',
  brandName = 'LAUNCHPAD',
}: PitchInvitationEmailProps) => {
  const isSpanish = locale === 'es';
  const effectiveClientTag = clientTag || clientName || 'Client';
  const effectiveTagline = tagline || (isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL');
  const effectivePillarsLabel = pillarsLabel || (isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE');
  const effectiveBadgeText = badgeText || (isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS');

  // Subtitle (clean without forced prefix)
  const displaySubtitle = pitchSubtitle
    ? pitchSubtitle.replace(/^Where ideas take off\s*•?\s*/gi, '').trim() || pitchSubtitle
    : '';

  // Split paragraphs to ensure bulletproof rendering across Gmail/Outlook
  const introParagraphs = (introMessage || '')
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const previewText = isSpanish
    ? `Propuesta Exclusiva: ${pitchTitle} — ${clientName}`
    : `Exclusive Proposal: ${pitchTitle} — ${clientName}`;

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{`
          body { margin: 0 !important; padding: 0 !important; background-color: #07070b !important; }
          table { border-collapse: collapse !important; mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
          td { mso-line-height-rule: exactly !important; }
          a { text-decoration: none; }
          @media only screen and (max-width: 600px) {
            .mobile-container { width: 100% !important; max-width: 100% !important; padding-left: 14px !important; padding-right: 14px !important; }
            .mobile-card { padding: 22px 16px !important; }
            .mobile-title { font-size: 20px !important; line-height: 26px !important; }
            .mobile-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle} className="mobile-container">
          {/* Top Brand Header with Official Logo and Lower Border */}
          <table width="100%" border={0} cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: '28px' }}>
            <tr>
              <td
                align="left"
                width="45%"
                style={{
                  paddingTop: '20px',
                  paddingBottom: '22px',
                  borderBottom: '1px solid #232336',
                  verticalAlign: 'middle',
                  width: '45%',
                }}
              >
                <Img
                  src="https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png"
                  width="145"
                  height="auto"
                  alt={brandName}
                  style={{
                    display: 'block',
                    maxWidth: '145px',
                    height: 'auto',
                    border: 'none',
                    outline: 'none',
                  }}
                />
              </td>
              <td
                align="right"
                width="55%"
                style={{
                  paddingTop: '20px',
                  paddingBottom: '22px',
                  borderBottom: '1px solid #232336',
                  verticalAlign: 'middle',
                  width: '55%',
                  textAlign: 'right',
                }}
              >
                <span
                  style={{
                    ...badgeStyle,
                    borderColor: accentColor,
                    color: accentColor,
                  }}
                >
                  {effectiveBadgeText}
                </span>
              </td>
            </tr>
          </table>

          {/* Intro Message Section */}
          <Section style={introSection}>
            {recipientName && (
              <Text style={greetingText}>
                {isSpanish ? `Hola, ${recipientName}` : `Hello, ${recipientName}`}
              </Text>
            )}
            {introParagraphs.map((paragraph, idx) => (
              <Text key={idx} style={introParagraph}>
                {paragraph}
              </Text>
            ))}
          </Section>

          {/* ═══ VIP Monolithic Proposal Card (Bulletproof Table with explicit TD padding) ═══ */}
          <table
            width="100%"
            border={0}
            cellPadding={0}
            cellSpacing={0}
            role="presentation"
            style={{
              backgroundColor: '#0d0d18',
              border: '1px solid #232338',
              borderTop: `3px solid ${accentColor}`,
              borderRadius: '10px',
              marginBottom: '22px',
            }}
          >
            <tr>
              <td
                style={{
                  padding: '30px 28px 26px 28px',
                }}
                className="mobile-card"
              >
                {/* Client Tag + Category Metadata */}
                <div style={{ marginBottom: '16px' }}>
                  <span
                    style={{
                      ...clientPillStyle,
                      borderColor: accentColor,
                      color: '#ffffff',
                      marginRight: '10px',
                    }}
                  >
                    [ {effectiveClientTag} ]
                  </span>
                  <span style={taglineMetaStyle}>
                    {effectiveTagline}
                  </span>
                </div>

                {/* Pitch Title */}
                <Text style={pitchTitleStyle} className="mobile-title">
                  {pitchTitle}
                </Text>

                {/* Pitch Subtitle */}
                {displaySubtitle ? (
                  <Text style={pitchSubtitleStyle}>
                    {displaySubtitle}
                  </Text>
                ) : null}

                <Hr style={dividerStyle} />

                {/* Key Squads / Highlights as Interactive-style Tab Cards */}
                {keyPillars && keyPillars.length > 0 && (
                  <div style={{ margin: '22px 0 26px 0' }}>
                    <Text style={pillarsLabelStyle}>
                      {effectivePillarsLabel}
                    </Text>
                    
                    {keyPillars.slice(0, 3).map((pillar, idx) => {
                      const num = String(idx + 1).padStart(2, '0');
                      return (
                        <table
                          key={idx}
                          width="100%"
                          border={0}
                          cellPadding={0}
                          cellSpacing={0}
                          role="presentation"
                          style={squadTabTableStyle}
                        >
                          <tr>
                            <td style={squadTabCellStyle}>
                              <table width="100%" border={0} cellPadding={0} cellSpacing={0} role="presentation">
                                <tr>
                                  <td width="36" style={{ verticalAlign: 'middle', width: '36px' }}>
                                    <span
                                      style={{
                                        fontFamily: 'monospace, Courier, sans-serif',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: accentColor,
                                        backgroundColor: '#1b1b2e',
                                        border: `1px solid ${accentColor}`,
                                        padding: '3px 7px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {num}
                                    </span>
                                  </td>
                                  <td style={{ paddingLeft: '14px', verticalAlign: 'middle' }}>
                                    <Text style={squadTitleStyle}>
                                      {pillar.title}
                                    </Text>
                                    {pillar.subtitle && (
                                      <Text style={squadSubtitleStyle}>
                                        {pillar.subtitle}
                                      </Text>
                                    )}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      );
                    })}
                  </div>
                )}

                {/* CTA Button with generous breathing room */}
                <Section style={{ textAlign: 'center', marginTop: '30px', marginBottom: '14px' }}>
                  <Button
                    href={pitchUrl}
                    style={{
                      ...buttonStyle,
                      backgroundColor: accentColor,
                      color: accentColor.toUpperCase() === '#FFFFFF' ? '#000000' : '#ffffff',
                    }}
                    className="mobile-btn"
                  >
                    {buttonText || (isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →')}
                  </Button>
                </Section>

                {/* Direct Link fallback */}
                <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '4px' }}>
                  <Text style={fallbackLinkText}>
                    {isSpanish ? 'Enlace de acceso directo:' : 'Direct access link:'}{' '}
                    <Link href={pitchUrl} style={{ color: accentColor, textDecoration: 'underline' }}>
                      {linkText || (isSpanish ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →')}
                    </Link>
                  </Text>
                </div>
              </td>
            </tr>
          </table>

          {/* Presenter Sign-off (Executive Card with explicit TD padding) */}
          <table
            width="100%"
            border={0}
            cellPadding={0}
            cellSpacing={0}
            role="presentation"
            style={{
              backgroundColor: '#0d0d18',
              border: '1px solid #232338',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <tr>
              <td style={{ padding: '16px 20px' }}>
                <table width="100%" border={0} cellPadding={0} cellSpacing={0} role="presentation">
                  <tr>
                    <td width="38" style={{ verticalAlign: 'middle', width: '38px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '32px',
                          height: '32px',
                          lineHeight: '32px',
                          textAlign: 'center',
                          borderRadius: '50%',
                          backgroundColor: '#161626',
                          border: '1px solid #2e2e46',
                          color: accentColor,
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'monospace, Courier, sans-serif',
                        }}
                      >
                        EM
                      </span>
                    </td>
                    <td style={{ paddingLeft: '14px', verticalAlign: 'middle' }}>
                      <Text style={signerNameStyle}>{senderName}</Text>
                      <Text style={signerRoleStyle}>{senderRole}</Text>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerLegalText}>
              © {new Date().getFullYear()} {brandName} · Where ideas take off
            </Text>
            <Text style={footerNoteText}>
              {isSpanish
                ? 'Este correo contiene información confidencial y propietaria destinada exclusivamente al cliente receptor.'
                : 'This email contains proprietary and confidential information intended solely for the recipient.'}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default PitchInvitationEmail;

// ═══════════════════════════════════════════════════════════════════
// Inline Styles (Cross-client Bulletproof Dark Architecture)
// ═══════════════════════════════════════════════════════════════════

const mainStyle: React.CSSProperties = {
  backgroundColor: '#07070b',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: '#e2e8f0',
  margin: 0,
  padding: '24px 0',
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '580px',
  margin: '0 auto',
  backgroundColor: '#07070b',
  padding: '0 16px',
};

const headerSection: React.CSSProperties = {
  padding: '24px 0 20px 0',
  borderBottom: '1px solid #232336',
  marginBottom: '28px',
};

const brandLogoText: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  color: '#ffffff',
  margin: 0,
  lineHeight: '24px',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'monospace, Courier, sans-serif',
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  padding: '4px 10px',
  borderRadius: '3px',
  border: '1px solid #333348',
  backgroundColor: '#161622',
  display: 'inline-block',
  maxWidth: '100%',
  boxSizing: 'border-box',
  textAlign: 'center',
};

const introSection: React.CSSProperties = {
  marginBottom: '24px',
};

const greetingText: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#ffffff',
  margin: '0 0 10px 0',
  letterSpacing: '-0.02em',
};

const introParagraph: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#cbd5e1',
  margin: '0 0 12px 0',
};

const cardSection: React.CSSProperties = {
  backgroundColor: '#0d0d18',
  border: '1px solid #232338',
  borderRadius: '10px',
  padding: '28px 24px',
  marginBottom: '20px',
};

const clientPillStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace, Courier, sans-serif',
  fontWeight: 'bold',
  letterSpacing: '0.12em',
  padding: '4px 10px',
  borderRadius: '3px',
  border: '1px solid #38384f',
  backgroundColor: '#161622',
  display: 'inline-block',
};

const taglineMetaStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace, Courier, sans-serif',
  fontWeight: 'bold',
  color: '#94a3b8',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  display: 'inline-block',
  textAlign: 'right',
};

const pitchTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  lineHeight: '30px',
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '-0.02em',
  margin: '8px 0 6px 0',
};

const pitchSubtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#cbd5e1',
  margin: 0,
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #232336',
  margin: '20px 0',
};

const pillarsLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace, Courier, sans-serif',
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  color: '#94a3b8',
  textTransform: 'uppercase',
  margin: '0 0 12px 0',
};

const squadTabTableStyle: React.CSSProperties = {
  marginBottom: '10px',
  width: '100%',
};

const squadTabCellStyle: React.CSSProperties = {
  backgroundColor: '#131322',
  border: '1px solid #24243a',
  borderRadius: '8px',
  padding: '12px 14px',
};

const squadTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 2px 0',
  lineHeight: '18px',
};

const squadSubtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: 0,
  lineHeight: '15px',
};

const buttonStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '0.16em',
  padding: '14px 32px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  textTransform: 'uppercase',
};

const fallbackLinkText: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: 0,
  lineHeight: '16px',
};

const signatureCardSection: React.CSSProperties = {
  backgroundColor: '#0d0d18',
  border: '1px solid #232338',
  borderRadius: '8px',
  padding: '14px 18px',
  marginBottom: '20px',
};

const signerNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#ffffff',
  margin: '0 0 2px 0',
  lineHeight: '18px',
  letterSpacing: '-0.01em',
};

const signerRoleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  fontFamily: 'monospace, Courier, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  margin: 0,
};

const footerSection: React.CSSProperties = {
  textAlign: 'center',
  padding: '18px 0 24px 0',
  borderTop: '1px solid #232336',
};

const footerLegalText: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  margin: '0 0 6px 0',
  fontFamily: 'monospace, Courier, sans-serif',
};

const footerNoteText: React.CSSProperties = {
  fontSize: '10px',
  color: '#475569',
  margin: 0,
  lineHeight: '14px',
};
