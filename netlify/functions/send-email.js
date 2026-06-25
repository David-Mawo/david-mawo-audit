exports.handler = async function(event, context) {
  // Only allow POST
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

  // Send report to client
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
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:20px;">
            <div style="background:#0B2545;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#B8973A;text-transform:uppercase;font-weight:600;">David B. Mawo, LFSA · Financial Advisor · Alberta</p>
              <h1 style="margin:0;font-size:22px;color:#FFFFFF;">Your Financial Literacy Report</h1>
            </div>
            <div style="background:#FFFFFF;padding:32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#8A95A3;text-transform:uppercase;">Overall literacy score</p>
              <p style="margin:0;font-size:56px;font-weight:600;color:#0B2545;line-height:1;">${totalScore}<span style="font-size:24px;color:#B8973A;">%</span></p>
              <span style="display:inline-block;margin-top:10px;padding:4px 16px;border-radius:99px;font-size:12px;font-weight:600;background:${totalScore>=80?'#E1F5EE':totalScore>=60?'#FAEEDA':totalScore>=40?'#E6F1FB':'#FCEBEB'};color:${totalScore>=80?'#0F6E56':totalScore>=60?'#854F0B':totalScore>=40?'#185FA5':'#A32D2D'};">${tierLabel}</span>
              ${tags && tags.length ? `<p style="margin:16px 0 0;font-size:12px;color:#8A95A3;">Your profile: <strong style="color:#0B2545;">${tags.join(' · ')}</strong></p>` : ''}
            </div>
            <div style="background:#0B2545;padding:32px;text-align:center;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 6px;font-size:11px;color:#B8973A;text-transform:uppercase;font-weight:600;">Next step</p>
              <p style="margin:0 0 6px;font-size:19px;color:#FFFFFF;">Book your complimentary consultation</p>
              <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.65);">David will review your scores before the meeting.</p>
              <a href="${BOOKING_LINK}" style="display:inline-block;background:#B8973A;color:#0B2545;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Schedule a free consultation →</a>
              <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,.4);">30-minute call · No obligation · Alberta residents only</p>
            </div>
            <p style="text-align:center;font-size:12px;color:#8A95A3;margin-top:20px;">This report is for educational purposes only and does not constitute personalized financial advice.</p>
          </div>`
      })
    });

    const reportResult = await reportRes.json();
    console.log('Client email result:', JSON.stringify(reportResult));

    // Send advisor notification
    const advisorRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `Audit System <${FROM_EMAIL}>`,
        to: [ADVISOR_EMAIL],
        subject: `New audit: ${name || email} — ${totalScore}% literacy score`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:10px;padding:28px;border:1px solid #E2E8F0;">
            <h2 style="margin:0 0 4px;color:#0B2545;">New audit submission</h2>
            <p style="margin:0 0 20px;color:#8A95A3;">A prospect just completed the Alberta Financial Literacy Audit</p>
            <table width="100%">
              <tr><td style="color:#8A95A3;padding:6px 0;width:100px;">Name</td><td style="font-weight:600;color:#1A1A2E;">${name || 'Not provided'}</td></tr>
              <tr><td style="color:#8A95A3;padding:6px 0;">Email</td><td style="font-weight:600;color:#1A1A2E;">${email}</td></tr>
              <tr><td style="color:#8A95A3;padding:6px 0;">Phone</td><td style="font-weight:600;color:#1A1A2E;">${phone || 'Not provided'}</td></tr>
              <tr><td style="color:#8A95A3;padding:6px 0;">Score</td><td style="font-weight:600;color:#0B2545;">${totalScore}% — ${tierLabel}</td></tr>
              <tr><td style="color:#8A95A3;padding:6px 0;">Profile</td><td style="font-weight:600;color:#1A1A2E;">${tags ? tags.join(', ') : 'Not completed'}</td></tr>
            </table>
          </div>`
      })
    });

    const advisorResult = await advisorRes.json();
    console.log('Advisor email result:', JSON.stringify(advisorResult));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch(e) {
    console.error('Email send error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
