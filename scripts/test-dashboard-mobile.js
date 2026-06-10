const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const VIEWPORT = { width: 375, height: 812 };
const PW = 'MarvalAdmin2026!';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function capture(page, label) {
  const url = page.url().split('?')[0];
  const layout = await page.evaluate(() => {
    const d = document.documentElement;
    return { sw: d.scrollWidth, cw: d.clientWidth, sh: d.scrollHeight, ch: d.clientHeight, hh: d.scrollWidth > d.clientWidth, vv: d.scrollHeight > d.clientHeight };
  });
  const hasOverflowHidden = await page.evaluate(() => {
    const body = window.getComputedStyle(document.body);
    return body.overflowX === 'hidden' || body.overflowY === 'hidden';
  });

  console.log(`[${String(label).padEnd(20)}] ${url.substring(0, 40)} w=${layout.sw} h=${layout.sh} v=${layout.cw}x${layout.ch} h-scroll=${layout.hh?'⚠️':'✅'} content-fits=${layout.vv?'scrolling':'✅'} overflow-hidden=${hasOverflowHidden?'⚠️':'✅'}`);
  
  // Touch targets - only interactive elements
  const small = await page.evaluate(() => {
    const all = document.querySelectorAll('button, a[href], [role="button"], input, select, textarea');
    let tiny = 0, details = [];
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.width < 100 && Math.min(r.width, r.height) > 0 && Math.min(r.width, r.height) < 36) {
        const txt = el.textContent?.trim()?.substring(0, 20) || el.getAttribute('aria-label') || '';
        if (txt && !txt.startsWith('LAUNCHPAD') && !txt.startsWith('©') && !txt.startsWith('dashboard') && details.length < 10) {
          tiny++;
          const dim = `${Math.round(r.width)}x${Math.round(r.height)}`;
          details.push(`${txt.substring(0, 15)} (${dim})`);
        }
      }
    });
    return { count: tiny, details };
  });
  if (small.count > 0) console.log(`  🔴 ${small.count} small: ${small.details.join(', ')}`);
}

(async () => {
  console.log('=== DASHBOARD MOBILE RESPONSIVE AUDIT ===\n');

  // Ensure admin exists
  let admin = await prisma.user.findUnique({ where: { email: 'admin@themarvals.com' } });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(PW, 10);
    admin = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@themarvals.com', password: hash, role: 'ADMIN', isActive: true, permissions: ['dashboard', 'quotes', 'invoices', 'clients', 'showcase', 'products', 'tickets', 'logs', 'contacts', 'settings', 'projects', 'tasks', 'notes', 'calendar', 'reminders'] }
    });
  }
  console.log(`Admin: ${admin.name}`);

  // Clean OTPs
  await prisma.otpCode.deleteMany({ where: { action: 'LOGIN', used: false } });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/marval/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  const errs = [];
  page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text().substring(0, 100)); });

  // ===== AUTHENTICATE =====
  console.log('\n--- Authenticating ---');
  await page.goto(`${BASE}/es`, { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(3000);

  // Gate flow - click lock button
  await page.evaluate(() => {
    const icons = document.querySelectorAll('.material-icons');
    for (const ico of icons) { if (ico.textContent === 'lock' && ico.closest('button')) { ico.closest('button').click(); return; } }
  });
  await sleep(2000);

  // Fill email
  const modalInput = await page.$('input[type="email"]');
  if (!modalInput) { console.log('❌ No gate modal'); await browser.close(); await prisma.$disconnect(); return; }
  await modalInput.click();
  await page.keyboard.type('admin@themarvals.com', { delay: 15 });
  await sleep(500);

  // Submit gate
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const b of btns) if (b.offsetParent !== null) { b.click(); return; }
  });
  await sleep(5000);
  if (!page.url().includes('/login')) { console.log('❌ Gate failed'); await browser.close(); await prisma.$disconnect(); return; }
  console.log('Gate: ✅');

  // Login - fill password
  const pwInput = await page.$('input[type="password"]');
  if (!pwInput) { console.log('❌ No password field'); await browser.close(); await prisma.$disconnect(); return; }
  await pwInput.click();
  await page.keyboard.type(PW, { delay: 15 });
  await sleep(500);
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const b of btns) if (b.offsetParent !== null) { b.click(); return; }
  });
  await sleep(5000);
  console.log('Password: ✅');

  // OTP
  const otpInput = await page.$('input[placeholder="000000"]');
  if (!otpInput) { console.log('❌ No OTP input'); await browser.close(); await prisma.$disconnect(); return; }
  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId: admin.id, action: 'LOGIN', used: false },
    orderBy: { createdAt: 'desc' }
  });
  if (!otpRecord) { console.log('❌ No OTP'); await browser.close(); await prisma.$disconnect(); return; }
  
  await otpInput.click();
  await page.keyboard.type(otpRecord.code, { delay: 10 });
  await sleep(500);
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const b of btns) if (b.offsetParent !== null) { b.click(); return; }
  });
  await sleep(5000);
  
  if (page.url().includes('/login')) { console.log('❌ Auth failed'); await browser.close(); await prisma.$disconnect(); return; }
  console.log('Auth: ✅');
  console.log(`URL: ${page.url()}`);

  // ===== TEST DASHBOARD PAGES =====
  console.log('\n--- Dashboard Pages ---');

  // Since we're logged in, let's try navigating directly
  // The OTP flow should have set a session cookie
  const pagesToTest = [
    { url: '/es/dashboard', label: 'Main Dashboard' },
    { url: '/es/dashboard/settings', label: 'Settings' },
    { url: '/es/dashboard/logs', label: 'Logs' },
    { url: '/es/dashboard/invoices', label: 'Invoices' },
    { url: '/es/dashboard/quotes', label: 'Quotes' },
    { url: '/es/dashboard/products', label: 'Products' },
    { url: '/es/dashboard/tickets', label: 'Tickets' },
    { url: '/es/dashboard/clients', label: 'Clients' },
    { url: '/es/dashboard/contacts', label: 'Contacts' },
    { url: '/es/dashboard/showcase', label: 'Showcase' },
    { url: '/es/dashboard/productivity/tasks', label: 'Tasks' },
    { url: '/es/dashboard/productivity/projects', label: 'Projects' },
    { url: '/es/dashboard/productivity/notes', label: 'Notes' },
    { url: '/es/dashboard/productivity/reminders', label: 'Reminders' },
    { url: '/es/dashboard/productivity/calendar', label: 'Calendar' },
  ];

  for (const p of pagesToTest) {
    await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle0', timeout: 20000 }).catch(e => console.log(`  ❌ ${p.label}: ${e.message.substring(0, 60)}`));
    await sleep(3000);
    
    if (page.url().includes('/login')) {
      console.log(`[${String(p.label).padEnd(20)}] ❌ Redirected to login (session expired)`);
      break;
    }
    await capture(page, p.label);
  }

  console.log(`\n=== Console errors: ${errs.length > 0 ? errs.join(' | ') : '✅ None'}`);
  await browser.close();
  await prisma.$disconnect();
  console.log('\n=== AUDIT COMPLETE ===');
})();
