import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
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
  pitchUrl: string;
  accentColor?: string;
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
  pitchUrl = 'https://launchpad.themarvals.com',
  accentColor = '#FF7D00',
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

  // Sanitize subtitle to prevent duplicate "Where ideas take off"
  const rawSubtitle = pitchSubtitle || '';
  const sanitizedSubtitle = rawSubtitle
    .replace(/^Where ideas take off\s*•?\s*/gi, '')
    .replace(/^Where ideas take off\s*•?\s*/gi, '')
    .trim();
  const displaySubtitle = sanitizedSubtitle
    ? `Where ideas take off • ${sanitizedSubtitle}`
    : 'Where ideas take off';

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
          
          {/* Top Brand Header (Pure typography matching LandingNav, 100% bulletproof) */}
          <Section style={headerSection}>
            <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
              <tr>
                <td align="left" style={{ verticalAlign: 'middle' }}>
                  <Text style={brandLogoText}>{brandName}</Text>
                </td>
                <td align="right" style={{ verticalAlign: 'middle' }}>
                  <span
                    style={{
                      ...badgeStyle,
                      borderColor: `${accentColor}50`,
                      color: accentColor,
                    }}
                  >
                    {isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS'}
                  </span>
                </td>
              </tr>
            </table>
          </Section>

          {/* Intro Message Section (preserves paragraph breaks cleanly) */}
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

          {/* ═══ VIP Proposal Card (Bulletproof Table Structure) ═══ */}
          <Section style={cardSection} className="mobile-card">
            
            {/* Top Accent Line */}
            <div
              style={{
                height: '2px',
                backgroundColor: accentColor,
                marginBottom: '20px',
                borderRadius: '2px',
              }}
            />

            {/* Client Tag + Subtitle Metadata */}
            <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ marginBottom: '14px' }}>
              <tr>
                <td align="left" style={{ verticalAlign: 'middle' }}>
                  <span
                    style={{
                      ...clientPillStyle,
                      borderColor: `${accentColor}60`,
                      backgroundColor: `${accentColor}20`,
                      color: '#ffffff',
                    }}
                  >
                    [ {clientName.toUpperCase()} ]
                  </span>
                </td>
                <td align="right" style={{ verticalAlign: 'middle' }}>
                  <span style={taglineMetaStyle}>
                    {isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL'}
                  </span>
                </td>
              </tr>
            </table>

            {/* Pitch Title */}
            <Text style={pitchTitleStyle} className="mobile-title">
              {pitchTitle}
            </Text>

            {/* Pitch Subtitle */}
            <Text style={pitchSubtitleStyle}>
              {displaySubtitle}
            </Text>

            <Hr style={dividerStyle} />

            {/* Key Pillars Highlights (Table Layout) */}
            {keyPillars && keyPillars.length > 0 && (
              <div style={{ margin: '20px 0 24px 0' }}>
                <Text style={pillarsLabelStyle}>
                  {isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE'}
                </Text>
                
                <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
                  {keyPillars.slice(0, 3).map((pillar, idx) => {
                    const num = String(idx + 1).padStart(2, '0');
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '6px 0', verticalAlign: 'top', width: '32px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: accentColor,
                              backgroundColor: `${accentColor}18`,
                              border: `1px solid ${accentColor}40`,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              display: 'inline-block',
                            }}
                          >
                            {num}
                          </span>
                        </td>
                        <td style={{ padding: '6px 0 6px 10px', verticalAlign: 'middle' }}>
                          <Text style={pillarTitleStyle}>
                            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{pillar.title}</span>
                            {pillar.subtitle && (
                              <span style={pillarSubtitleStyle}> — {pillar.subtitle}</span>
                            )}
                          </Text>
                        </td>
                      </tr>
                    );
                  })}
                </table>
              </div>
            )}

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '14px' }}>
              <Button
                href={pitchUrl}
                style={{
                  ...buttonStyle,
                  backgroundColor: accentColor,
                  color: accentColor.toUpperCase() === '#FFFFFF' ? '#000000' : '#ffffff',
                }}
                className="mobile-btn"
              >
                {isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →'}
              </Button>
            </Section>

            {/* Direct Link fallback */}
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <Text style={fallbackLinkText}>
                {isSpanish ? 'Enlace de acceso directo:' : 'Direct access link:'}{' '}
                <Link href={pitchUrl} style={{ color: accentColor, textDecoration: 'underline' }}>
                  {isSpanish ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →'}
                </Link>
              </Text>
            </div>
          </Section>

          {/* Presenter Executive Signature Card */}
          <Section style={signatureSection}>
            <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ verticalAlign: 'middle', width: '40px', paddingRight: '12px' }}>
                  <div
                    style={{
                      ...avatarStyle,
                      borderColor: `${accentColor}50`,
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }}
                  >
                    {senderName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text style={signerNameStyle}>{senderName}</Text>
                  <Text style={signerRoleStyle}>{senderRole}</Text>
                  {senderEmail && (
                    <Link href={`mailto:${senderEmail}`} style={signerEmailStyle}>
                      {senderEmail}
                    </Link>
                  )}
                </td>
              </tr>
            </table>
          </Section>

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
  maxWidth: '580px',
  margin: '0 auto',
  backgroundColor: '#07070b',
  padding: '0 12px',
};

const headerSection: React.CSSProperties = {
  padding: '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  marginBottom: '24px',
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
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  padding: '4px 10px',
  borderRadius: '3px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  display: 'inline-block',
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
  backgroundColor: '#0d0d14',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  padding: '28px 24px',
  marginBottom: '24px',
};

const clientPillStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '0.2em',
  padding: '3px 8px',
  borderRadius: '3px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'inline-block',
};

const taglineMetaStyle: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'monospace',
  color: '#64748b',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

const pitchTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  lineHeight: '28px',
  fontWeight: 900,
  color: '#ffffff',
  letterSpacing: '-0.02em',
  margin: '6px 0 6px 0',
};

const pitchSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: 0,
};

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(255, 255, 255, 0.08)',
  margin: '18px 0 16px 0',
};

const pillarsLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '0.18em',
  color: '#64748b',
  textTransform: 'uppercase',
  margin: '0 0 10px 0',
};

const pillarTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  margin: 0,
  lineHeight: '18px',
};

const pillarSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  fontWeight: 'normal',
};

const buttonStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.16em',
  padding: '14px 28px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  textTransform: 'uppercase',
};

const fallbackLinkText: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  margin: 0,
  lineHeight: '16px',
};

const signatureSection: React.CSSProperties = {
  padding: '14px 18px',
  backgroundColor: '#0a0a10',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  marginBottom: '24px',
};

const avatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  textAlign: 'center',
  lineHeight: '34px',
};

const signerNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 800,
  color: '#ffffff',
  margin: 0,
  lineHeight: '16px',
};

const signerRoleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '2px 0 0 0',
};

const signerEmailStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  textDecoration: 'none',
  fontFamily: 'monospace',
};

const footerSection: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px 0 24px 0',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
};

const footerLegalText: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  margin: '0 0 6px 0',
  fontFamily: 'monospace',
};

const footerNoteText: React.CSSProperties = {
  fontSize: '10px',
  color: '#475569',
  margin: 0,
  lineHeight: '14px',
};
