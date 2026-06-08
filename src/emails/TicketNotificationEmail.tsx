import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { theme, main, container, header, logo, separator, subtitle, card, footer, footerText, footerNote } from './StrategyAuditEmail';

interface TicketNotificationEmailProps {
  type: 'NEW_TICKET' | 'TICKET_REPLY';
  ticketId: string;
  subject: string;
  message: string;
  clientName: string;
  priority?: string;
  locale?: string;
}

const t = (locale: string, es: string, en: string) => (locale === 'en' ? en : es);

export const TicketNotificationEmail = ({
  type = 'NEW_TICKET',
  ticketId = '123456',
  subject = 'Server is down',
  message = 'The main server is unresponsive and throwing 502 errors.',
  clientName = 'Acme Corp',
  priority = 'HIGH',
  locale = 'es',
}: TicketNotificationEmailProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || process.env.CLOUDINARY_LOGO_URL || 'https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png';

  const isNew = type === 'NEW_TICKET';
  
  const badgesEn: Record<string, string> = { LOW: '🟢 Low', MEDIUM: '🟡 Medium', HIGH: '🟠 High', URGENT: '🔴 Urgent' };
  const badgesEs: Record<string, string> = { LOW: '🟢 Baja', MEDIUM: '🟡 Media', HIGH: '🟠 Alta', URGENT: '🔴 Urgente' };
  const priorityBadge = (locale === 'en' ? badgesEn : badgesEs)[priority] || priority;
  
  const priorityColors: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444' };
  const badgeColor = priorityColors[priority] || theme.primary;

  const adminLink = `https://admin.themarvals.com/dashboard/tickets/${ticketId}`;
  const clientLink = `https://admin.themarvals.com/client-portal/tickets/${ticketId}`;

  return (
    <Html>
      <Head />
      <Preview>{isNew ? `[${t(locale, 'Nuevo Ticket', 'New Ticket')}] ${subject}` : `Re: ${subject}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} width="280" alt="LAUNCHPAD" style={logo} />
            <div style={separator}></div>
            <Text style={subtitle}>by Masterminds</Text>
          </Section>

          <Section style={card}>
            {isNew ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{
                    backgroundColor: `${theme.primary}15`,
                    color: theme.primary,
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '4px 10px',
                    border: `1px solid ${theme.primary}30`,
                    borderRadius: '4px'
                  }}>
                    🎫 {t(locale, 'Nuevo Ticket', 'New Ticket')}
                  </span>
                </div>
                <Text style={{ color: theme.ink, fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                  {subject}
                </Text>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ color: theme.body, fontSize: '12px', fontWeight: '500', padding: '4px 10px', border: `1px solid ${theme.hairline}`, borderRadius: '4px', marginRight: '8px' }}>
                    👤 {clientName}
                  </span>
                  <span style={{ color: badgeColor, fontSize: '11px', fontWeight: '600', padding: '4px 10px', border: `1px solid ${badgeColor}40`, borderRadius: '4px' }}>
                    {priorityBadge}
                  </span>
                </div>
                <Section style={{ backgroundColor: theme.canvas, border: `1px solid ${theme.hairline}`, padding: '24px', marginBottom: '24px', borderRadius: '4px' }}>
                  <Text style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: theme.muted, margin: '0 0 8px 0', fontWeight: '700' }}>
                    {t(locale, 'Descripción del Problema', 'Problem Description')}
                  </Text>
                  <Text style={{ color: theme.body, fontSize: '14px', lineHeight: '1.7', margin: '0', whiteSpace: 'pre-wrap' }}>
                    {message}
                  </Text>
                </Section>
                <Section style={{ textAlign: 'center' }}>
                  <Link href={adminLink} style={buttonStyle}>
                    {t(locale, 'Gestionar en el Portal →', 'Manage in Portal →')}
                  </Link>
                </Section>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{
                    backgroundColor: `${theme.secondary}12`,
                    color: theme.secondary,
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '4px 10px',
                    border: `1px solid ${theme.secondary}28`,
                    borderRadius: '4px'
                  }}>
                    💬 {t(locale, 'Soporte LAUNCHPAD', 'LAUNCHPAD Support')}
                  </span>
                </div>
                <Text style={{ color: theme.body, fontSize: '14px', margin: '0 0 16px 0' }}>
                  {t(locale, 'Hola', 'Hello')} <strong style={{ color: theme.ink }}>{clientName}</strong>, {t(locale, 'el equipo de soporte ha respondido a tu ticket:', 'the support team has replied to your ticket:')}
                </Text>
                <Text style={{ color: theme.ink, fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: `1px solid ${theme.hairline}` }}>
                  📋 {subject}
                </Text>
                <Section style={{ backgroundColor: theme.canvas, border: `1px solid ${theme.hairline}`, padding: '24px', marginBottom: '24px', borderRadius: '4px' }}>
                  <Text style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: theme.secondary, margin: '0 0 8px 0', fontWeight: '700' }}>
                    {t(locale, 'Respuesta de LAUNCHPAD', 'LAUNCHPAD Response')}
                  </Text>
                  <Text style={{ color: theme.body, fontSize: '14px', lineHeight: '1.7', margin: '0', whiteSpace: 'pre-wrap' }}>
                    {message}
                  </Text>
                </Section>
                <Section style={{ textAlign: 'center' }}>
                  <Link href={clientLink} style={buttonStyle}>
                    {t(locale, 'Ver en el Portal de Cliente →', 'View in Client Portal →')}
                  </Link>
                </Section>
                <Text style={{ color: theme.mutedSoft, fontSize: '11px', margin: '24px 0 0 0', textAlign: 'center' }}>
                  {t(locale, 'También puedes responder directamente desde tu portal de gestión.', 'You can also reply directly from your management portal.')}
                </Text>
              </>
            )}
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

export default TicketNotificationEmail;

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: theme.primary,
  color: '#f3f3ff',
  textDecoration: 'none',
  padding: '12px 28px',
  fontWeight: '700',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  borderRadius: '4px',
};
