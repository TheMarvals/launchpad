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

interface RemindersEmailProps {
  userName: string;
  data: {
    tasks: any[];
    events: any[];
    vpsExpirations: any[];
    openTickets?: any[];
    expiringQuotes?: any[];
    failedActions?: any[];
  };
  locale?: string;
}

const t = (locale: string, es: string, en: string) => (locale === 'en' ? en : es);

const sectionStyle = {
  marginTop: '20px',
  padding: '20px',
  backgroundColor: theme.canvas,
  border: `1px solid ${theme.hairline}`,
  borderRadius: '4px',
};

export const RemindersEmail = ({
  userName = 'Admin',
  data = { tasks: [], events: [], vpsExpirations: [] },
  locale = 'es',
}: RemindersEmailProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || process.env.CLOUDINARY_LOGO_URL || 'https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png';

  const controlCenterLink = `https://admin.themarvals.com/dashboard/productivity/reminders`;

  return (
    <Html>
      <Head />
      <Preview>{t(locale, 'Resumen de Recordatorios', 'Reminders Summary')}</Preview>
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
                🚀 {t(locale, 'Resumen Ejecutivo', 'Executive Summary')}
              </span>
            </div>
            
            <Text style={{ color: theme.ink, fontSize: '22px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {t(locale, 'Hola', 'Hello')} {userName},
            </Text>
            
            <Text style={{ color: theme.body, fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px 0' }}>
              {t(locale, 'Hemos consolidado los eventos y tareas críticas que requieren tu supervisión para esta semana:', 'We have consolidated the critical events and tasks that require your attention this week:')}
            </Text>

            {data.vpsExpirations && data.vpsExpirations.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: theme.secondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  💾 {t(locale, 'VPS por Vencer', 'VPS Expiring Soon')}
                </Text>
                {data.vpsExpirations.map((v, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>{v.name}</Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {v.client?.razonSocial || t(locale, 'Cliente', 'Client')} — {t(locale, 'Vence:', 'Expires:')} {v.dueDate ? new Date(v.dueDate).toLocaleDateString(locale) : 'N/A'}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {data.failedActions && data.failedActions.length > 0 && (
              <Section style={{ ...sectionStyle, borderLeft: `3px solid ${theme.primary}` }}>
                <Text style={{ color: theme.primary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  ⚠️ {t(locale, 'Alertas de Auditoría', 'Audit Alerts')}
                </Text>
                {data.failedActions.map((a, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>
                      {(a.action || '').toUpperCase()} {t(locale, 'fallido', 'failed')}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {t(locale, 'Servidor:', 'Server:')} {a.server?.name || t(locale, 'Desconocido', 'Unknown')} — {t(locale, 'Por:', 'By:')} {a.user?.name || t(locale, 'Sistema', 'System')}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {data.tasks && data.tasks.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: theme.secondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  ✅ {t(locale, 'Tareas Pendientes', 'Pending Tasks')}
                </Text>
                {data.tasks.map((tItem, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>{tItem.title}</Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {t(locale, 'Fecha límite:', 'Due:')} {tItem.dueDate ? new Date(tItem.dueDate).toLocaleDateString(locale) : 'N/A'}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {data.openTickets && data.openTickets.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: theme.secondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  🎫 {t(locale, 'Tickets de Soporte', 'Support Tickets')}
                </Text>
                {data.openTickets.map((tItem, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>{tItem.subject}</Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {t(locale, 'Cliente:', 'Client:')} {tItem.client?.razonSocial || t(locale, 'Desconocido', 'Unknown')} — <span style={{ color: theme.primary, fontWeight: '600' }}>{tItem.status}</span>
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {data.expiringQuotes && data.expiringQuotes.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: theme.secondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  📄 {t(locale, 'Cotizaciones Próximas', 'Expiring Quotes')}
                </Text>
                {data.expiringQuotes.map((q, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>
                      {t(locale, 'Cotización', 'Quote')} #{q.correlativo}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {t(locale, 'Cliente:', 'Client:')} {q.client?.razonSocial || t(locale, 'Desconocido', 'Unknown')} — {t(locale, 'Expira:', 'Expires:')} {q.fechaValidez ? new Date(q.fechaValidez).toLocaleDateString(locale) : 'N/A'}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {data.events && data.events.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: theme.secondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  📅 {t(locale, 'Agenda Semanal', 'Weekly Agenda')}
                </Text>
                {data.events.map((e, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.hairline}` }}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>{e.title}</Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {new Date(e.start).toLocaleDateString(locale)} {t(locale, 'a las', 'at')} {new Date(e.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            <Section style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link href={controlCenterLink} style={{
                display: 'inline-block',
                backgroundColor: theme.primary,
                color: '#f3f3ff',
                textDecoration: 'none',
                padding: '14px 32px',
                fontWeight: '700',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                borderRadius: '4px',
              }}>
                {t(locale, 'Ir al Centro de Control', 'Go to Control Center')}
              </Link>
            </Section>
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

export default RemindersEmail;
