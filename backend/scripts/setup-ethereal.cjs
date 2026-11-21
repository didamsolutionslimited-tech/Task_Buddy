/*
 * Creates a permanent Ethereal test account (via the Nodemailer test API)
 * and writes its SMTP credentials into backend/.env so the same inbox
 * survives server restarts.
 *
 * View the inbox at https://ethereal.email/messages by logging in with
 * the account it prints.
 *
 * Run:  node scripts/setup-ethereal.cjs
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => {
        try { resolve(JSON.parse(out)); } catch { reject(new Error('Bad response: ' + out.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Requesting a permanent Ethereal test account...');
  const account = await post('https://api.nodemailer.com/user', {
    requestor: 'task-buddy',
    version: '1.0.0',
  });

  if (!account.user || !account.pass) {
    throw new Error('Ethereal API did not return credentials: ' + JSON.stringify(account));
  }

  let env = fs.readFileSync(ENV_PATH, 'utf8');

  // Replace or append the email block with the fixed test account
  const emailBlock = [
    'SMTP_HOST=smtp.ethereal.email',
    'SMTP_PORT=465',
    `SMTP_USER=${account.user}`,
    `SMTP_PASS=${account.pass}`,
    `SMTP_FROM=${account.user}`,
  ].join('\n');

  if (/^#? ?SMTP_HOST=/m.test(env)) {
    env = env.replace(/^#? ?SMTP_HOST=.*$/m, emailBlock.split('\n')[0]);
    // remove the other four SMTP lines then re-add
    env = env.replace(/^#? ?SMTP_(PORT|USER|PASS|FROM)=.*$\n?/gm, '');
    env = env.replace(/^SMTP_HOST=.*$/m, emailBlock);
  } else {
    env = env.trimEnd() + '\n\n# --- Email (OTP): permanent Ethereal test account ---\n' + emailBlock + '\n';
  }

  fs.writeFileSync(ENV_PATH, env);

  console.log('\nDone! SMTP credentials saved to backend/.env\n');
  console.log('  View your test inbox at: https://ethereal.email/messages');
  console.log('  Login (email):    ' + account.user);
  console.log('  Login (password): ' + account.pass);
  console.log('\nOTP emails sent by the app will appear in that inbox.');
  console.log('NOTE: this is a fake inbox - nothing is ever delivered to a real email address.');
})().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
