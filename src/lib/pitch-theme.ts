export const parsePitchTheme = (themeStr?: string, pitchTitle?: string, clientName?: string) => {
  const isDiDi = Boolean(
    (pitchTitle && pitchTitle.toLowerCase().includes('didi')) ||
    (clientName && clientName.toLowerCase().includes('didi')) ||
    themeStr === 'orange' ||
    themeStr === 'didi'
  );

  let color = isDiDi ? '#FF7D00' : '#A855F7';
  let font = 'outfit'; // 'outfit' | 'montserrat' | 'inter' | 'geist'
  let style: 'solid' | 'outline' = 'solid'; // default to crisp solid executive style
  let headerBadge = isDiDi ? 'DIDI RFI DECK' : 'PITCH DECK';

  if (themeStr) {
    if (themeStr.includes('|')) {
      const parts = themeStr.split('|');
      if (parts[0]) color = parts[0].trim();
      if (parts[1]) font = parts[1].trim();
      if (parts[2]) style = (parts[2].trim() as any) || 'solid';
      if (parts[3] !== undefined && parts[3].trim() !== '') headerBadge = parts[3].trim();
    } else if (themeStr.startsWith('{')) {
      try {
        const parsed = JSON.parse(themeStr);
        if (parsed.color) color = parsed.color;
        if (parsed.font) font = parsed.font;
        if (parsed.style) style = parsed.style;
        if (parsed.headerBadge) headerBadge = parsed.headerBadge;
      } catch (e) {}
    } else if (themeStr.startsWith('#')) {
      color = themeStr.trim();
    } else if (themeStr === 'orange' || themeStr === 'didi') {
      color = '#FF7D00';
    } else if (themeStr === 'purple' || themeStr === 'midnight' || themeStr === 'launchpad') {
      color = '#A855F7';
    } else if (themeStr === 'blue' || themeStr === 'cyber') {
      color = '#0062FF';
    } else if (themeStr === 'cyan') {
      color = '#00DCE5';
    } else if (themeStr === 'emerald') {
      color = '#10B981';
    } else if (themeStr === 'crimson') {
      color = '#EF4444';
    } else if (themeStr === 'amber') {
      color = '#F59E0B';
    }
  }

  return { color, font, style, headerBadge };
};

export const hexToRgba = (hex: string, alpha: number) => {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(168, 85, 247, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getFontFamily = (fontName: string) => {
  switch (fontName?.toLowerCase()) {
    case 'outfit':
      return "'Outfit', sans-serif";
    case 'montserrat':
      return "'Montserrat', sans-serif";
    case 'inter':
      return "'Inter', sans-serif";
    case 'geist':
      return "'Geist', sans-serif";
    default:
      return "'Outfit', sans-serif";
  }
};
