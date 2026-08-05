import 'server-only';

const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const MAX_RECIPIENTS = 50;

function parseRecipientField(value: string, label: string) {
  if (value.length > 5000) {
    throw new Error(`${label} supera el tamaño permitido`);
  }

  const entries = value
    .split(/[,;\n]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const invalidAddress = entries.find((entry) => !EMAIL_PATTERN.test(entry));
  if (invalidAddress) {
    throw new Error(`Dirección inválida en ${label}: ${invalidAddress}`);
  }

  return [...new Set(entries)];
}

export function normalizeEmailRecipients(input: { to: string; cc?: string; bcc?: string }) {
  const to = parseRecipientField(input.to, 'Para');
  const seen = new Set(to);
  const uniqueAdditionalRecipients = (entries: string[]) => entries.filter((entry) => {
    if (seen.has(entry)) return false;
    seen.add(entry);
    return true;
  });
  const cc = uniqueAdditionalRecipients(parseRecipientField(input.cc || '', 'CC'));
  const bcc = uniqueAdditionalRecipients(parseRecipientField(input.bcc || '', 'CCO'));

  if (to.length === 0) {
    throw new Error('Agrega al menos un destinatario');
  }

  if (seen.size > MAX_RECIPIENTS) {
    throw new Error(`Puedes enviar a un máximo de ${MAX_RECIPIENTS} destinatarios`);
  }

  return { to, cc, bcc };
}
