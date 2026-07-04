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

interface TaskAssignedEmailProps {
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  taskPriority: string;
  taskDueDate?: string;
  locale: string;
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

export const TaskAssignedEmail = ({
  assigneeName = 'Equipo',
  assignerName = 'Alguien',
  taskTitle = 'Nueva Tarea',
  taskPriority = 'medium',
  taskDueDate,
  locale = 'es',
}: TaskAssignedEmailProps) => {
  const previewText = t(
    locale,
    `Se te ha asignado una nueva tarea: ${taskTitle}`,
    `You have been assigned a new task: ${taskTitle}`
  );

  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: darkModeStyles }} />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://res.cloudinary.com/djwuzrjvz/image/upload/launchpad/lp_logo.png"
              width="150"
              alt="LAUNCHPAD"
              style={logo}
            />
          </Section>

          <Section style={card}>
            <Text style={{ ...subtitle, color: accentBlue, marginBottom: '8px' }}>
              NUEVA ASIGNACIÓN
            </Text>

            <Text style={{ fontSize: '20px', fontWeight: 'bold', color: theme.ink, marginTop: 0 }}>
              {t(
                locale,
                `Hola ${assigneeName},`,
                `Hi ${assigneeName},`
              )}
            </Text>

            <Text style={{ color: theme.muted, fontSize: '15px', lineHeight: '24px' }}>
              {t(
                locale,
                `${assignerName} te ha asignado la siguiente tarea en Launchpad:`,
                `${assignerName} has assigned you the following task in Launchpad:`
              )}
            </Text>

            <Section style={sectionStyle}>
              <Text style={{ fontSize: '18px', fontWeight: 'bold', color: theme.ink, margin: '0 0 10px 0' }}>
                {taskTitle}
              </Text>
              <Text style={{ margin: '5px 0', color: theme.muted, fontSize: '14px' }}>
                <strong style={{ color: theme.ink }}>{t(locale, 'Prioridad:', 'Priority:')}</strong> {taskPriority.toUpperCase()}
              </Text>
              {taskDueDate && (
                <Text style={{ margin: '5px 0', color: theme.muted, fontSize: '14px' }}>
                  <strong style={{ color: theme.ink }}>{t(locale, 'Vencimiento:', 'Due Date:')}</strong> {new Date(taskDueDate).toLocaleDateString(locale)}
                </Text>
              )}
            </Section>

            <Text style={{ color: theme.muted, fontSize: '14px', marginTop: '30px' }}>
              {t(
                locale,
                'Puedes ver los detalles y actualizar el estado de esta tarea en tu tablero de Launchpad.',
                'You can view details and update the status of this task on your Launchpad board.'
              )}
            </Text>
          </Section>

          <Section style={separator} />

          <Section style={footer}>
            <Text style={footerText}>LAUNCHPAD — Equipo Interno</Text>
            <Text style={footerNote}>
              {t(
                locale,
                'Este es un mensaje automático del sistema de productividad.',
                'This is an automated message from the productivity system.'
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TaskAssignedEmail;
