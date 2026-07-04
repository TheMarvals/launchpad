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
import { theme, main, container, header, logo, separator, subtitle, card, footer, footerText, footerNote, darkModeStyles } from './StrategyAuditEmail';

interface CalendarNotificationEmailProps {
  type: 'daily_digest' | 'tomorrow_preview' | 'hour_before' | 'event_shared';
  userName: string;
  locale: string;
  // For digest/preview:
  events?: Array<{
    title: string;
    start: string;
    end: string;
    description?: string;
    color: string;
    isRecurring?: boolean;
  }>;
  // For hour_before:
  event?: {
    title: string;
    start: string;
    end: string;
    description?: string;
    color: string;
  };
  // For event_shared:
  sharedByName?: string;
  sharedEvent?: {
    title: string;
    start: string;
    end: string;
    description?: string;
  };
}

const t = (locale: string, es: string, en: string) => (locale === 'en' ? en : es);

const accentBlue = '#3b82f6';

const sectionStyle = {
  marginTop: '20px',
  padding: '20px',
  backgroundColor: theme.canvas,
  border: `1px solid ${theme.hairline}`,
  borderRadius: '4px',
};

const eventRowStyle = {
  padding: '10px 0',
  borderBottom: `1px solid ${theme.hairline}`,
};

const colorDotStyle = (color: string) => ({
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: color,
  marginRight: '8px',
  verticalAlign: 'middle',
});

const formatTime = (isoString: string, locale: string) => {
  try {
    return new Date(isoString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

const formatDate = (isoString: string, locale: string) => {
  try {
    return new Date(isoString).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
};

const getTitle = (type: CalendarNotificationEmailProps['type'], locale: string, sharedByName?: string) => {
  switch (type) {
    case 'daily_digest':
      return t(locale, 'Tus eventos de hoy', 'Your events for today');
    case 'tomorrow_preview':
      return t(locale, 'Eventos de mañana', "Tomorrow's events");
    case 'hour_before':
      return t(locale, 'Comienza en 1 hora', 'Starting in 1 hour');
    case 'event_shared':
      return `${sharedByName || ''} ${t(locale, 'compartió un evento contigo', 'shared an event with you')}`;
  }
};

const getEmoji = (type: CalendarNotificationEmailProps['type']) => {
  switch (type) {
    case 'daily_digest': return '📅';
    case 'tomorrow_preview': return '🗓️';
    case 'hour_before': return '⏰';
    case 'event_shared': return '🤝';
  }
};

const getBadgeLabel = (type: CalendarNotificationEmailProps['type'], locale: string) => {
  switch (type) {
    case 'daily_digest':
      return t(locale, 'Resumen Diario', 'Daily Digest');
    case 'tomorrow_preview':
      return t(locale, 'Vista Previa', 'Preview');
    case 'hour_before':
      return t(locale, 'Recordatorio', 'Reminder');
    case 'event_shared':
      return t(locale, 'Evento Compartido', 'Shared Event');
  }
};

export const CalendarNotificationEmail = ({
  type = 'daily_digest',
  userName = 'Admin',
  locale = 'es',
  events = [],
  event,
  sharedByName,
  sharedEvent,
}: CalendarNotificationEmailProps) => {
  const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || process.env.CLOUDINARY_LOGO_URL || 'https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png';

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{darkModeStyles}</style>
      </Head>
      <Preview>{getTitle(type, locale, sharedByName)}</Preview>
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
                backgroundColor: `${accentBlue}12`,
                color: accentBlue,
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '4px 10px',
                border: `1px solid ${accentBlue}28`,
                borderRadius: '4px',
              }}>
                {getEmoji(type)} {getBadgeLabel(type, locale)}
              </span>
            </div>

            <Text style={{ color: theme.ink, fontSize: '22px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {t(locale, 'Hola', 'Hello')} {userName},
            </Text>

            <Text style={{ color: accentBlue, fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
              {getTitle(type, locale, sharedByName)}
            </Text>

            {/* DAILY DIGEST */}
            {type === 'daily_digest' && events.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: accentBlue, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  📅 {t(locale, `${events.length} evento${events.length !== 1 ? 's' : ''}`, `${events.length} event${events.length !== 1 ? 's' : ''}`)}
                </Text>
                {events.map((e, i) => (
                  <div key={i} style={eventRowStyle}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>
                      <span style={colorDotStyle(e.color)}>●</span>
                      {e.title}
                      {e.isRecurring && <span style={{ color: theme.muted, fontSize: '11px', marginLeft: '6px' }}>🔁</span>}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {formatTime(e.start, locale)} — {formatTime(e.end, locale)}
                      {e.description && (
                        <span style={{ color: theme.mutedSoft, marginLeft: '8px' }}>· {e.description}</span>
                      )}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {type === 'daily_digest' && events.length === 0 && (
              <Text style={{ color: theme.muted, fontSize: '14px', lineHeight: '1.6', margin: '12px 0' }}>
                {t(locale, 'No tienes eventos programados para hoy. ¡Disfruta tu día!', 'You have no events scheduled for today. Enjoy your day!')}
              </Text>
            )}

            {/* TOMORROW PREVIEW */}
            {type === 'tomorrow_preview' && events.length > 0 && (
              <Section style={sectionStyle}>
                <Text style={{ color: accentBlue, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  🗓️ {t(locale, `${events.length} evento${events.length !== 1 ? 's' : ''} mañana`, `${events.length} event${events.length !== 1 ? 's' : ''} tomorrow`)}
                </Text>
                {events.map((e, i) => (
                  <div key={i} style={eventRowStyle}>
                    <Text style={{ color: theme.ink, fontWeight: '600', fontSize: '14px', margin: '0' }}>
                      <span style={colorDotStyle(e.color)}>●</span>
                      {e.title}
                      {e.isRecurring && <span style={{ color: theme.muted, fontSize: '11px', marginLeft: '6px' }}>🔁</span>}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: '12px', margin: '4px 0 0 0' }}>
                      {formatTime(e.start, locale)} — {formatTime(e.end, locale)}
                      {e.description && (
                        <span style={{ color: theme.mutedSoft, marginLeft: '8px' }}>· {e.description}</span>
                      )}
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {type === 'tomorrow_preview' && events.length === 0 && (
              <Text style={{ color: theme.muted, fontSize: '14px', lineHeight: '1.6', margin: '12px 0' }}>
                {t(locale, 'No tienes eventos programados para mañana.', 'You have no events scheduled for tomorrow.')}
              </Text>
            )}

            {/* HOUR BEFORE */}
            {type === 'hour_before' && event && (
              <Section style={{ ...sectionStyle, borderLeft: `3px solid ${event.color || accentBlue}` }}>
                <Text style={{ color: accentBlue, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  ⏰ {t(locale, 'Próximo Evento', 'Upcoming Event')}
                </Text>
                <div style={{ padding: '4px 0' }}>
                  <Text style={{ color: theme.ink, fontWeight: '700', fontSize: '18px', margin: '0 0 8px 0' }}>
                    <span style={colorDotStyle(event.color)}>●</span>
                    {event.title}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: '13px', margin: '0 0 4px 0' }}>
                    📍 {formatTime(event.start, locale)} — {formatTime(event.end, locale)}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: '13px', margin: '0 0 4px 0' }}>
                    📆 {formatDate(event.start, locale)}
                  </Text>
                  {event.description && (
                    <Text style={{ color: theme.body, fontSize: '13px', lineHeight: '1.5', margin: '12px 0 0 0', padding: '12px', backgroundColor: theme.canvas, borderRadius: '4px', border: `1px solid ${theme.hairline}` }}>
                      {event.description}
                    </Text>
                  )}
                </div>
              </Section>
            )}

            {/* EVENT SHARED */}
            {type === 'event_shared' && sharedEvent && (
              <Section style={{ ...sectionStyle, borderLeft: `3px solid ${accentBlue}` }}>
                <Text style={{ color: accentBlue, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px 0', fontWeight: '700' }}>
                  🤝 {t(locale, 'Evento Compartido', 'Shared Event')}
                </Text>
                <Text style={{ color: theme.body, fontSize: '14px', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                  <strong style={{ color: theme.ink }}>{sharedByName}</strong> {t(locale, 'te ha compartido el siguiente evento:', 'has shared the following event with you:')}
                </Text>
                <div style={{ padding: '4px 0' }}>
                  <Text style={{ color: theme.ink, fontWeight: '700', fontSize: '18px', margin: '0 0 8px 0' }}>
                    {sharedEvent.title}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: '13px', margin: '0 0 4px 0' }}>
                    📍 {formatTime(sharedEvent.start, locale)} — {formatTime(sharedEvent.end, locale)}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: '13px', margin: '0 0 4px 0' }}>
                    📆 {formatDate(sharedEvent.start, locale)}
                  </Text>
                  {sharedEvent.description && (
                    <Text style={{ color: theme.body, fontSize: '13px', lineHeight: '1.5', margin: '12px 0 0 0', padding: '12px', backgroundColor: theme.canvas, borderRadius: '4px', border: `1px solid ${theme.hairline}` }}>
                      {sharedEvent.description}
                    </Text>
                  )}
                </div>
              </Section>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>LAUNCHPAD — {t(locale, 'Notificaciones de Calendario', 'Calendar Notifications')}</Text>
            <Text style={footerNote}>{t(locale, 'Este es un mensaje automático del sistema.', 'This is an automated system message.')}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CalendarNotificationEmail;
