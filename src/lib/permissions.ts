/**
 * Available dashboard view permissions for ADMIN users.
 * Each permission controls visibility of a sidebar link.
 */
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  QUOTES: 'quotes',
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  SHOWCASE: 'showcase',
  PRODUCTS: 'products',
  TICKETS: 'tickets',
  LOGS: 'logs',
  SETTINGS: 'settings',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  NOTES: 'notes',
  CALENDAR: 'calendar',
  REMINDERS: 'reminders',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** All available permissions */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Grouped permissions for UI display */
export const PERMISSION_GROUPS: { label: string; permissions: { key: Permission; labelKey: string }[] }[] = [
  {
    label: 'Management',
    permissions: [
      { key: PERMISSIONS.DASHBOARD, labelKey: 'dashboard' },
      { key: PERMISSIONS.CLIENTS, labelKey: 'clients' },
      { key: PERMISSIONS.QUOTES, labelKey: 'quotes' },
      { key: PERMISSIONS.INVOICES, labelKey: 'invoices' },
      { key: PERMISSIONS.PRODUCTS, labelKey: 'products' },
    ],
  },
  {
    label: 'Support',
    permissions: [
      { key: PERMISSIONS.TICKETS, labelKey: 'tickets' },
    ],
  },
  {
    label: 'Marketing',
    permissions: [
      { key: PERMISSIONS.SHOWCASE, labelKey: 'showcase' },
    ],
  },
  {
    label: 'Audit',
    permissions: [
      { key: PERMISSIONS.LOGS, labelKey: 'logs' },
    ],
  },
  {
    label: 'Productivity',
    permissions: [
      { key: PERMISSIONS.PROJECTS, labelKey: 'projects' },
      { key: PERMISSIONS.TASKS, labelKey: 'tasks' },
      { key: PERMISSIONS.NOTES, labelKey: 'notes' },
      { key: PERMISSIONS.CALENDAR, labelKey: 'calendar' },
      { key: PERMISSIONS.REMINDERS, labelKey: 'reminders' },
    ],
  },
  {
    label: 'Configuration',
    permissions: [
      { key: PERMISSIONS.SETTINGS, labelKey: 'settings' },
    ],
  },
];

/** Check if a user has a specific permission */
export function hasPermission(userPermissions: string[] | undefined | null, permission: Permission): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}
