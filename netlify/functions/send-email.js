// netlify/functions/send-email.js
// CommonJS format — works with Netlify's default Node runtime

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL    = 'audit@davidmawo.ca';
  const ADVISOR_EMAIL = 'bmawodavid@gmail.com';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { recipientEmail, recipientHtml, recipientSubject, advisorHtml, advisorSubject } = body;

  if (!recipientEmail || !recipientHtml || !advisorHtml) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const errors = [];

  // Send report to respondent
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `David B. Mawo, CFP <${FROM_EMAIL}>`,
        to: [recipientEmail],
        subject: recipientSubject,
        html: recipientHtml
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      errors.push({ target: 'respondent', status: res.status, message: err.message });
      console.error('Resend respondent error:', err);
    }
  } catch(e) {
    errors.push({ target: 'respondent', message: e.message });
  }

  // Send notification to David
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `Audit System <${FROM_EMAIL}>`,
        to: [ADVISOR_EMAIL],
        subject: advisorSubject,
        html: advisorHtml
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      errors.push({ target: 'advisor', status: res.status, message: err.message });
      console.error('Resend advisor error:', err);
    }
  } catch(e) {
    errors.push({ target: 'advisor', message: e.message });
  }

  const success = errors.length === 0;
  return {
    statusCode: success ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success, errors: errors.length ? errors : undefined })
  };
};
