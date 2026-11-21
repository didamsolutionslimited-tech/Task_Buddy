/*
 * SMTP credential verifier - usage:
 *   node scripts/verify-smtp.cjs <host> <port-optional> <user> <pass> [to]
 * Tries a real SMTP login; sends one test mail if a recipient is given.
 */
const nodemailer = require('nodemailer');

(async () => {
  const [host, portArg, user, pass, to] = process.argv.slice(2);
  const port = Number(portArg) || 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 20000,
  });

  try {
    await transporter.verify();
    console.log(`LOGIN OK on ${host}:${port} as ${user}`);
  } catch (err) {
    console.log('LOGIN FAILED:', err.code || '', err.message?.split('\n')[0]);
    process.exit(1);
  }

  if (to) {
    try {
      const info = await transporter.sendMail({
        from: `"Task Buddy"${user.endsWith('@ethereal.email') ? '' : ''} <${user}>`,
        to,
        subject: 'SMTP test from Task Buddy',
        text: 'If you can read this in your inbox, real OTP delivery works.',
      });
      console.log('TEST MAIL SENT:', info.messageId);
    } catch (err) {
      console.log('MAIL SEND FAILED:', err.code || '', err.message?.split('\n')[0]);
      process.exit(1);
    }
  }
})();
