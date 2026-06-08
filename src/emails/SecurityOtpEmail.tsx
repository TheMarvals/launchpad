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
import { theme, main, container, header, logo, separator, subtitle, card, footer, footerText, footerNote } from './StrategyAuditEmail';

interface SecurityOtpEmailProps {
  code: string;
  userName: string;
  title: string;
  description: string;
  locale?: string;
}

const t = (locale: string, es: string, en: string) => (locale === 'en' ? en : es);

export const SecurityOtpEmail = ({
  code = '123456',
  userName = 'John Doe',
  title = 'Verificación de Acceso',
  description = 'Usa este código para verificar tu identidad.',
  locale = 'es',
}: SecurityOtpEmailProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || process.env.CLOUDINARY_LOGO_URL || 'https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png';

  return (
    <Html>
      <Head />
      <Preview>{`${title}: ${code}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="280" alt="LAUNCHPAD" style={logo} />
            <div style={separator}></div>
            <Text style={subtitle}>by Masterminds</Text>
          </Section>

          <Section style={card}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                backgroundColor: `${theme.primary}12`,
                color: theme.primary,
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '4px 10px',
                border: `1px solid ${theme.primary}28`,
                borderRadius: '4px'
              }}>
                🔐 {t(locale, 'Seguridad', 'Security')}
              </span>
            </div>
            
            <Text style={{ color: theme.ink, fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {title}
            </Text>
            
            <Text style={{ color: theme.body, fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              {t(locale, 'Hola', 'Hello')} <strong style={{ color: theme.ink }}>{userName}</strong>,<br />
              {description}
            </Text>

            <Section style={{
              backgroundColor: theme.canvas,
              border: `1px solid ${theme.hairline}`,
              padding: '28px',
              textAlign: 'center',
              marginBottom: '20px',
              borderRadius: '4px'
            }}>
              <Text style={{ color: theme.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700', margin: '0 0 8px 0' }}>
                {t(locale, 'Código de Acceso', 'Access Code')}
              </Text>
              <Text style={{ fontFamily: 'monospace', fontSize: '34px', fontWeight: '800', letterSpacing: '10px', color: theme.ink, margin: '0' }}>
                {code}
              </Text>
            </Section>

            <Text style={{ color: theme.mutedSoft, fontSize: '11px', lineHeight: '1.5', margin: '0' }}>
              {t(locale, 'Este código expirará en 10 minutos por motivos de seguridad.', 'This code will expire in 10 minutes for security reasons.')}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>© 2026 LAUNCHPAD · by Masterminds</Text>
            <Text style={footerNote}>{t(locale, 'Este es un mensaje automático del sistema.', 'This is an automated system message.')}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SecurityOtpEmail;
