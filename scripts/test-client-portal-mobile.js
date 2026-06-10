const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const VIEWPORT = { width: 375, height: 812 };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function capture(page, label) {
  const url = page.url().split('?')[0];
  const layout = await page.evaluate(() => {
    const d = document.documentElement;
    return { sw: d.scrollWidth, cw: d.clientWidth, sh: d.scrollHeight, ch: d.clientHeight, hh: d.scrollWidth > d.clientWidth, vv: d.scrollHeight > d.clientHeight };
  });
  console.log(`[${label}] ${url.substring(0, 50)} (${layout.sw}x${layout.sh} v${layout.cw}x${layout.ch}) h=${layout.hh?'⚠️':'✅'} v-scroll=${layout.vv ? (layout.sh > layout.ch+100 ? '✅' : 'minimal') : 'none'}`);
  
  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    return { title: (h1 || h2)?.textContent?.substring(0, 60) || '' };
  });
  console.log(`  "${info.title}"`);

  // Touch targets - look at ALL elements with actual interaction
  const small = await page.evaluate(() => {
    // Check for icon buttons specifically (material-icons inside buttons)
    const iconBtns = document.querySelectorAll('button .material-icons, a .material-icons, [role="button"] .material-icons');
    let iconIssues = [];
    iconBtns.forEach(icon => {
      const p = icon.closest('button, a, [role="button"]');
      if (p) {
        const r = p.getBoundingClientRect();
        if (Math.min(r.width, r.height) < 36) {
          iconIssues.push(`${icon.textContent} btn=${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
    });
    
    // Check standalone elements
    const standaloneIssues = [];
    const all = document.querySelectorAll('button, a[href], [role="button"]');
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && Math.min(r.width, r.height) > 0 && Math.min(r.width, r.height) < 36) {
        const txt = el.textContent?.trim()?.substring(0, 15) || el.getAttribute('aria-label') || '';
        if (txt && !txt.startsWith('LAUNCHPAD') && !txt.startsWith('©')) {
          standaloneIssues.push(`${txt} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
    });
    
    return { icons: iconIssues.slice(0, 8), standalone: standaloneIssues.slice(0, 8) };
  });
  
  if (small.icons.length > 0) console.log(`  🔴 Icon btns: ${small.icons.join(', ')}`);
  if (small.standalone.length > 0) console.log(`  🔴 Small els: ${small.standalone.join(', ')}`);
  if (small.icons.length === 0 && small.standalone.length === 0) console.log('  Touch targets ✅');
}

(async () => {
  console.log('=== CLIENT PORTAL MOBILE VISUAL TEST ===\n');

  // Create or find a CLIENT user
  const clientUserPw = 'TestClient2026!';
  const bcrypt = require('bcryptjs');
  const pwHash = await bcrypt.hash(clientUserPw, 10);

  // Find or create a client
  let client = await prisma.client.findFirst();
  if (!client) {
    client = await prisma.client.create({
      data: {
        rut: '77.777.777-7', razonSocial: 'CLIENTE DE PRUEBA SPA',
        giro: 'SERVICIOS TECNOLÓGICOS', direccion: 'CALLE FALSA 123',
        comuna: 'SANTIAGO', ciudad: 'SANTIAGO',
        email: 'cliente@test.cl', telefono: '+569 1234 5678'
      }
    });
  }

  let clientUser = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  if (!clientUser) {
    clientUser = await prisma.user.create({
      data: {
        name: 'Cliente Test', email: 'cliente@test.cl',
        password: pwHash, role: 'CLIENT', isActive: true,
        clientId: client.id,
        permissions: ['servers', 'tickets', 'quotes']
      }
    });
  }

  // Ensure password is up to date
  await prisma.user.update({
    where: { id: clientUser.id },
    data: { password: pwHash }
  });

  console.log(`Client user: ${clientUser.name} (${clientUser.email}) role=${clientUser.role}`);

  // Clean old OTPs
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
  page.on('requestfailed', req => {
    const u = req.url();
    if (!u.includes('favicon') && !u.includes('google') && !u.includes('fonts') && !u.includes('gstatic'))
      console.log(`  ❌ ${req.url().substring(0, 60)} → ${req.failure().errorText}`);
  });

  // ===== STEP 1: Gate flow =====
  console.log('\n--- 1. Gate flow ---');
  await page.goto(`${BASE}/es`, { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(3000);

  // Click lock button
  await page.evaluate(() => {
    const icons = document.querySelectorAll('.material-icons');
    for (const ico of icons) if (ico.textContent === 'lock' && ico.closest('button')) { ico.closest('button').click(); return; }
  });
  await sleep(2000);

  // Fill email
  const modalInput = await page.$('input[type="email"]');
  if (!modalInput) { console.log('❌ No modal'); await browser.close(); await prisma.$disconnect(); return; }
  await modalInput.click();
  await page.keyboard.type(clientUser.email, { delay: 20 });
  await sleep(500);

  // Submit gate
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const b of btns) if (b.offsetParent !== null) { b.click(); return; }
  });
  console.log('Gate submitted');
  await sleep(5000);

  if (!page.url().includes('/login')) { console.log('❌ Not on login'); await browser.close(); await prisma.$disconnect(); return; }
  await capture(page, 'Login page');

  // ===== STEP 2: Login (password) =====
  console.log('\n--- 2. Login ---');
  const pwInput = await page.$('input[type="password"]');
  if (!pwInput) { console.log('❌ No password field'); await browser.close(); await prisma.$disconnect(); return; }
  await pwInput.click();
  await page.keyboard.type(clientUserPw, { delay: 20 });
  await sleep(500);

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  console.log('Login submitted');
  await sleep(6000);
  console.log(`URL: ${page.url()}`);
  await capture(page, 'After login');

  // ===== STEP 3: OTP =====
  console.log('\n--- 3. OTP ---');
  const otpInput = await page.$('input[placeholder="000000"]');
  if (!otpInput) {
    console.log('❌ No OTP. State:');
    const st = await page.evaluate(() => ({
      url: window.location.href,
      inputs: Array.from(document.querySelectorAll('input')).filter(i => i.offsetParent !== null).map(i => ({ t: i.type, ph: i.placeholder })),
      errors: Array.from(document.querySelectorAll('[class*="warning"], [class*="error"], [class*="alert"]')).map(e => e.textContent?.trim()?.substring(0, 60)),
    }));
    console.log(JSON.stringify(st, null, 2));
    await browser.close(); await prisma.$disconnect(); return;
  }

  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId: clientUser.id, action: 'LOGIN', used: false },
    orderBy: { createdAt: 'desc' }
  });
  if (!otpRecord) { console.log('❌ No OTP in DB'); await browser.close(); await prisma.$disconnect(); return; }
  
  console.log(`OTP: ${otpRecord.code}`);
  await otpInput.click();
  await page.keyboard.type(otpRecord.code, { delay: 10 });
  await sleep(500);

  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const b of btns) if (b.offsetParent !== null) { b.click(); return; }
  });
  console.log('OTP submitted');
  await sleep(5000);
  console.log(`URL after OTP: ${page.url()}`);
  
  // ===== STEP 4: Client Portal Pages =====
  const authed = !page.url().includes('/login');
  if (!authed) { console.log('❌ Auth failed'); await browser.close(); await prisma.$disconnect(); return; }

  console.log('\n--- 4. Portal Pages ---');
  
  const portalPages = [
    '/es/client-portal',
    '/es/client-portal/servers',
    '/es/client-portal/tickets',
    '/es/client-portal/tickets/new',
    '/es/client-portal/quotes',
  ];
  
  for (const p of portalPages) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await sleep(3000);
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log(`[${p}] ❌ Redirected to login`);
      continue;
    }
    await capture(page, p.replace('/es/client-portal/', '') || 'Home');
  }
  
  // Server detail
  const serverLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/servers/"]'))
      .map(l => l.getAttribute('href')).filter(Boolean).slice(0, 2);
  });
  
  if (serverLinks.length > 0) {
    await page.goto(`${BASE}${serverLinks[0]}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await sleep(3000);
    if (!page.url().includes('/login')) {
      await capture(page, 'Server detail');
      
      // Check for files tab
      await page.goto(`${BASE}${serverLinks[0].replace(/\/?$/, '')}/files`, { waitUntil: 'networkidle0', timeout: 20000 });
      await sleep(3000);
      if (!page.url().includes('/login')) await capture(page, 'Server files');
    }
  }

  // Ticket detail  
  const ticketLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/tickets/"]'))
      .map(l => l.getAttribute('href')).filter(h => h && !h.endsWith('/new') && !h.endsWith('/tickets')).slice(0, 2);
  });
  
  if (ticketLinks.length > 0) {
    await page.goto(`${BASE}${ticketLinks[0]}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await sleep(3000);
    if (!page.url().includes('/login')) await capture(page, 'Ticket detail');
  }

  console.log(`\n=== Console errors: ${errs.length > 0 ? errs.join(' | ') : '✅ None'}`);
  await browser.close();
  await prisma.$disconnect();
  console.log('\n=== DONE ===');
})();
