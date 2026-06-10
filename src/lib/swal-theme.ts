/**
 * Shared SweetAlert2 theme configuration.
 * All Swal.fire calls should use these configs for:
 * - Consistent dark theme across the app
 * - Mobile-responsive width (prevents overflow on narrow screens)
 * - Proper touch targets for buttons
 */

export const swalTheme = {
  background: '#1a1a2e',
  color: '#e2e8f0',
  width: 'auto',
  customClass: {
    popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink !w-[90vw] sm:!w-auto',
    title: 'text-ink font-semibold',
    htmlContainer: 'text-muted text-sm',
    confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary hover:bg-primary-hover transition-colors',
    cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas hover:text-ink transition-colors',
    input: 'w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm',
  },
};

/** For confirmation/delete dialogs (danger variant) */
export const swalDangerTheme = {
  ...swalTheme,
  customClass: {
    ...swalTheme.customClass,
    confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-danger text-white hover:opacity-80 transition-colors',
    cancelButton: swalTheme.customClass.cancelButton,
  },
};

/** For toast notifications — compact, positioned bottom-end so it's visible on mobile */
export const swalToastTheme = {
  background: '#1a1a2e',
  color: '#e2e8f0',
  toast: true,
  position: 'bottom-end' as const,
  showConfirmButton: false,
  timer: 2500,
  showClass: {
    popup: 'animate-in fade-in zoom-in-95 duration-200',
  },
  hideClass: {
    popup: 'animate-out fade-out zoom-out-95 duration-150',
  },
  customClass: {
    popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink !w-[90vw] sm:!w-auto',
    title: 'text-ink text-sm font-semibold',
  },
};
