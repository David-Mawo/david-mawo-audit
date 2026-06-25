exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = 'audit@davidmawo.ca';
  const ADVISOR_EMAIL = 'bmawodavid@gmail.com';
  const BOOKING_LINK = 'https://calendar.app.google/kBd2mhsKuEs7XB5h7';

  console.log('send-email function called');
  console.log('RESEND_API_KEY present:', !!RESEND_API_KEY);

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch(e) {
    console.error('Failed to parse body:', e);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, phone, scores, totalScore, tags, profile } = data;
  console.log('Sending email to:', email);

  const tierLabel = totalScore >= 80 ? 'Strong literacy'
    : totalScore >= 60 ? 'Developing'
    : totalScore >= 40 ? 'Foundational'
    : 'Awareness gaps';

  // ── Personalized message logic ──────────────────────────────────────────
  const CLOSING = `In our first conversation, I will evaluate your current situation, identify the specific strategies that apply to you, and show you a financial projection comparing where you are headed today versus what an optimized plan could deliver. No obligation — just clarity. <a href="${BOOKING_LINK}" style="color:#B8973A;">Book your free strategy session here.</a>`;

  function getPersonalizedMessage(profile, totalScore) {
    const p = profile || {};
    const band = totalScore >= 70 ? 'high' : totalScore >= 40 ? 'mid' : 'low';
    const employ = p.employ || '';
    const age = p.age || '';
    const family = p.family || '';
    const home = p.home || '';

    // Incorporated professionals
    if (employ === 'corp') {
      if (band === 'low') return `Your results show that your corporation may be working against you financially. Retained earnings sitting in your company are being taxed inefficiently, and without the right structure you're likely paying more personal tax than necessary. The Capital Dividend Account, corporate-owned life insurance, and an Insured Retirement Plan are strategies specifically designed for your situation — and most incorporated professionals in Alberta have never been shown them. This conversation could be worth hundreds of thousands of dollars over your career. ${CLOSING}`;
      if (band === 'mid') return `You understand the basics but your results reveal that you're likely leaving corporate tax advantages on the table. The gap between a good financial plan and an optimal one for an incorporated professional often comes down to one or two strategies — the CDA, the CSV lending approach, or a properly structured buy-sell agreement. Let's identify exactly which ones apply to you. ${CLOSING}`;
      return `Your financial literacy is exceptional for an incorporated professional. At your level, the conversation shifts from education to execution — ensuring your corporate structure, life insurance, and estate plan are fully integrated. The difference between good and optimal at this stage is significant. Let's validate your current setup. ${CLOSING}`;
    }

    // Pre-retirees
    if (age === '40s' || age === '60p') {
      if (band === 'low') return `Your results show that retirement is closer than your financial plan may be ready for. The decisions you make in the next 5–10 years — when to take CPP, how to draw down your RRSP, how to structure your estate — will determine your financial reality for the rest of your life. These are not decisions to leave to chance or to revisit later. Let's build a clear roadmap while there's still time to optimize. ${CLOSING}`;
      if (band === 'mid') return `You have a good foundation but your results reveal gaps in RRIF drawdown strategy and estate planning that are extremely common at your stage. Many pre-retirees lose tens of thousands of dollars in unnecessary tax because of the order in which they draw from their accounts. A retirement income plan built now could make a significant difference to what you and your family keep. ${CLOSING}`;
      return `Your knowledge is strong and you're well positioned for retirement. The opportunity at your stage is to stress-test your plan against real scenarios — market downturns, a health event, a surviving spouse — and ensure your estate plan reflects your current wishes. Let's do that review together. ${CLOSING}`;
    }

    // Growing families
    if (family === 'kids') {
      if (band === 'low') return `Your results reveal significant exposure — particularly around income protection and estate planning. If something happened to you tomorrow, would your family be financially secure? Most families at your stage are one disability or death away from a financial crisis they didn't see coming. This is the most important conversation you can have right now. ${CLOSING}`;
      if (band === 'mid') return `You're doing several things right, but your results show gaps in RESP optimization and life insurance structuring that are common at your stage. Many families your age are underinsured by 40% or more without realizing it. A 30-minute review could identify exactly where your plan is exposed. ${CLOSING}`;
      return `Your financial literacy is strong. The opportunity now is to ensure your protection, savings, and estate plan are working together as a system rather than as separate products. Let's review whether your current coverage and beneficiary designations reflect where your family is today. ${CLOSING}`;
    }

    // Contractors
    if (employ === 'contract') {
      if (band === 'low') return `Your results show that while you're building your business, your personal financial plan may be significantly exposed. As a contractor, you have no employer disability, no group benefits, and no sick leave. One health event or business disruption could undo years of work. Let's talk about building a financial foundation that protects both you and what you've built. ${CLOSING}`;
      if (band === 'mid') return `You're aware of the basics but your results reveal gaps in protection and tax strategy specific to contractors. These are gaps your accountant may not flag because they fall outside their scope. Let's identify what's missing before it becomes a crisis. ${CLOSING}`;
      return `Your financial literacy is strong for a contractor. The opportunity now is to ensure your personal financial plan accounts for the unique risks of self-employment — particularly around income protection and tax efficiency. Let's validate your current setup. ${CLOSING}`;
    }

    // First-time buyers
    if (home === 'buying') {
      if (band === 'low') return `Your results show you're just getting started — and that's actually good news. The FHSA alone could save you up to $40,000 tax-free toward your first home, and a properly structured plan started now will serve you for decades. Let's talk. ${CLOSING}`;
      if (band === 'mid') return `You have a solid foundation but your results reveal gaps in FHSA and RRSP Home Buyers' Plan strategy that could cost you significantly. One conversation could close those gaps before you make your purchase. ${CLOSING}`;
      return `You're ahead of most first-time buyers financially. The next step is ensuring your FHSA, RRSP, and down payment strategy are fully optimized before you buy. Let's make sure everything is working together. ${CLOSING}`;
    }

    // Young professionals (default under 30 or 30s salaried)
    if (age === 'u30' || age === '30s') {
      if (band === 'low') return `Your results show you're just getting started with financial planning — and that's actually good news. The strategies that build the most wealth work best when started early. Your FHSA alone could save you up to $40,000 tax-free toward your first home, and a properly structured life insurance policy started at your age costs a fraction of what it will later. The gap between where you are and where you could be is closeable — but the window is short. Let's talk. ${CLOSING}`;
      if (band === 'mid') return `You have a solid foundation but your results reveal gaps in protection and tax strategy that could cost you significantly over the next decade. Most young professionals in your position are maximizing their TFSA but missing the FHSA and the right disability coverage. One conversation could close those gaps before they compound. ${CLOSING}`;
      return `You're ahead of your peers financially — now it's time to optimize. The next level for someone at your stage is building a tax-efficient foundation that will serve you whether you stay salaried or move toward self-employment. Let's make sure your strategy is built for where you're going, not just where you are. ${CLOSING}`;
    }

    // Default
    if (band === 'low') return `Your results reveal significant gaps that are costing you money right now. The good news is that most of these gaps are closeable quickly once you understand the right strategies for your situation. ${CLOSING}`;
    if (band === 'mid') return `You have a solid foundation but your results reveal specific gaps worth addressing. A 30-minute conversation could identify exactly where your plan is exposed and what to do about it. ${CLOSING}`;
    return `Your financial literacy is strong. The opportunity now is to ensure your knowledge is translating into an optimized implementation. Let's validate your current setup. ${CLOSING}`;
  }

  const personalizedMessage = getPersonalizedMessage(profile, totalScore);

  // ── Category score rows ─────────────────────────────────────────────────
  const catMeta = {
    tax: { label: 'Tax literacy' },
    registered: { label: 'Registered accounts' },
    investing: { label: 'Investing concepts' },
    insurance: { label: 'Insurance & protection' },
    estate: { label: 'Estate & legal' }
  };

  let catRows = '';
  if (scores) {
    Object.entries(catMeta).forEach(([k, m]) => {
      const d = scores[k];
      if (!d || d.possible === 0) return;
      const pct = Math.round(d.earned / d.possible * 100);
      const color = pct >= 75 ? '#1D9E75' : pct >= 40 ? '#EF9F27' : '#E24B4A';
      catRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#4A5568;width:160px;">${m.label}</td>
          <td style="padding:8px 12px;">
            <div style="background:#EEE;border-radius:99px;height:8px;width:100%;">
              <div style="background:${color};height:8px;border-radius:99px;width:${pct}%"></div>
            </div>
          </td>
          <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1A1A2E;width:40px;">${pct}%</td>
        </tr>`;
    });
  }

  const profileLine = tags && tags.length
    ? `<p style="margin:16px 0 0;font-size:12px;color:#8A95A3;">Your profile: <strong style="color:#0B2545;">${tags.join(' · ')}</strong></p>`
    : '';

  // ── Client report HTML ──────────────────────────────────────────────────
  const reportHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:#0B2545;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#B8973A;font-weight:600;">David B. Mawo, LFSA &nbsp;·&nbsp; Financial Advisor · Alberta</p>
  <h1 style="margin:0;font-size:22px;color:#FFFFFF;font-weight:500;">Your Financial Literacy Report</h1>
</td></tr>

<!-- Score -->
<tr><td style="background:#FFFFFF;padding:32px;text-align:center;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
  <p style="margin:0 0 8px;font-size:13px;color:#8A95A3;text-transform:uppercase;letter-spacing:.06em;">Overall literacy score</p>
  <p style="margin:0;font-size:56px;font-weight:600;color:#0B2545;line-height:1;">${totalScore}<span style="font-size:24px;color:#B8973A;">%</span></p>
  <span style="display:inline-block;margin-top:10px;padding:4px 16px;border-radius:99px;font-size:12px;font-weight:600;background:${totalScore>=80?'#E1F5EE':totalScore>=60?'#FAEEDA':totalScore>=40?'#E6F1FB':'#FCEBEB'};color:${totalScore>=80?'#0F6E56':totalScore>=60?'#854F0B':totalScore>=40?'#185FA5':'#A32D2D'};">${tierLabel}</span>
  ${profileLine}
</td></tr>

<!-- Category breakdown -->
${catRows ? `
<tr><td style="background:#FFFFFF;padding:0 32px 24px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
  <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0B2545;">Understanding by topic</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${catRows}
  </table>
</td></tr>` : ''}

<!-- Personalized message -->
<tr><td style="background:#FFFFFF;padding:0 32px 28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
  <div style="background:#F8F6F0;border-left:3px solid #B8973A;padding:16px 20px;border-radius:0 8px 8px 0;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#B8973A;text-transform:uppercase;letter-spacing:.06em;">A note from David</p>
    <p style="margin:0;font-size:13.5px;color:#1A1A2E;line-height:1.7;">${personalizedMessage}</p>
  </div>
</td></tr>

<!-- CTA -->
<tr><td style="background:#0B2545;padding:32px;text-align:center;border-radius:0 0 12px 12px;">
  <p style="margin:0 0 6px;font-size:11px;color:#B8973A;text-transform:uppercase;letter-spacing:.08em;font-weight:600;">Next step</p>
  <p style="margin:0 0 6px;font-size:19px;color:#FFFFFF;font-weight:500;">Book your complimentary consultation</p>
  <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.65);">David will review your scores before the meeting — so your first session goes straight to what matters most.</p>
  <a href="${BOOKING_LINK}" style="display:inline-block;background:#B8973A;color:#0B2545;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Schedule a free consultation →</a>
  <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,.4);">30-minute discovery call &nbsp;·&nbsp; No obligation &nbsp;·&nbsp; Alberta residents only</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 0;text-align:center;">
  <p style="margin:0;font-size:12px;color:#8A95A3;">This report is for educational purposes only and does not constitute personalized financial advice.<br>© 2025 David B. Mawo, LFSA · Financial Advisor · Alberta</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // ── Advisor notification HTML ───────────────────────────────────────────
  const advisorHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#F5F5F0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;padding:28px;border:1px solid #E2E8F0;">
  <h2 style="margin:0 0 4px;color:#0B2545;">New audit submission</h2>
  <p style="margin:0 0 20px;font-size:13px;color:#8A95A3;">A prospect just completed the Alberta Financial Literacy Audit</p>
  <table width="100%" cellpadding="0" cellspacing="4">
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;width:120px;">Name</td><td style="font-size:13px;font-weight:600;color:#1A1A2E;">${name||'Not provided'}</td></tr>
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;">Email</td><td style="font-size:13px;font-weight:600;color:#1A1A2E;">${email}</td></tr>
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;">Phone</td><td style="font-size:13px;font-weight:600;color:#1A1A2E;">${phone||'Not provided'}</td></tr>
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;">Score</td><td style="font-size:13px;font-weight:600;color:#0B2545;">${totalScore}% — ${tierLabel}</td></tr>
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;">Profile</td><td style="font-size:13px;font-weight:600;color:#1A1A2E;">${tags?tags.join(', '):'Not completed'}</td></tr>
    <tr><td style="font-size:13px;color:#8A95A3;padding:6px 0;">Submitted</td><td style="font-size:13px;color:#1A1A2E;">${new Date().toLocaleString('en-CA',{timeZone:'America/Edmonton'})}</td></tr>
  </table>
  ${catRows ? `
  <div style="margin-top:20px;padding:14px;background:#F5F5F0;border-radius:8px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#0B2545;">Category breakdown</p>
    <table width="100%" cellpadding="0" cellspacing="0">${catRows}</table>
  </div>` : ''}
  <p style="margin:20px 0 0;font-size:12px;color:#8A95A3;">View all leads in your <a href="https://supabase.com/dashboard/project/bohnnxsvejiqhxfhnzsi" style="color:#185FA5;">Supabase dashboard</a></p>
</div>
</body>
</html>`;

  try {
    const reportRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `David B. Mawo, LFSA <${FROM_EMAIL}>`,
        to: [email],
        subject: `Your Alberta Financial Literacy Report — ${totalScore}%`,
        html: reportHtml,
        headers: {
          'List-Unsubscribe': `<mailto:unsubscribe@davidmawo.ca>`,
          'X-Entity-Ref-ID': `audit-${Date.now()}`
        }
      })
    });
    const reportResult = await reportRes.json();
    console.log('Client email result:', JSON.stringify(reportResult));

    const advisorRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `Audit System <${FROM_EMAIL}>`,
        to: [ADVISOR_EMAIL],
        subject: `New audit: ${name||email} — ${totalScore}% literacy score`,
        html: advisorHtml
      })
    });
    const advisorResult = await advisorRes.json();
    console.log('Advisor email result:', JSON.stringify(advisorResult));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch(e) {
    console.error('Email send error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
