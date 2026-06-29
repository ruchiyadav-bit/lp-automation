const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, templateName, variables = {} }) {
  const templatePath = path.join(__dirname, "../../templates/email", `${templateName}.html`);
  let html = fs.readFileSync(templatePath, "utf8");

  // Simple {{variable}} replacement
  Object.entries(variables).forEach(([key, val]) => {
    html = html.replaceAll(`{{${key}}}`, val);
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };
