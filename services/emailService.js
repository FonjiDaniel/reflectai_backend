const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function sendWelcomeEmail(toEmail, name) {
  const mailOptions = {
    from: "ReflectAI Support",
    to: toEmail,
    subject: "🎉 Welcome to ReflectAI!",
    html: `
         <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color:rgb(132, 120, 240);">Hi ${name}, 👋</h2>
          <p style="font-size: 16px; color: #333;">Welcome to <strong>ReflectAI</strong> – your personal AI-powered diary platform.</p>
          <p style="font-size: 15px; color: #555;">
            Here's what you can do:
            <ul style="padding-left: 20px; flex-direction: column; gap: 5px;">
              <li>📝 Write and organize your daily thoughts</li>
              <li>💡 Get AI-powered suggestions and mood analysis and autocompletions</li>
              <li>🔒 Secure and private journaling</li>
            </ul>
          </p>
          <p style="font-size: 15px; color: #333;">We're thrilled to have you on board. If you have any questions, just reply to this email – we're happy to help.</p>
          <p style="font-size: 15px; color: #333;">Cheers,<br><strong>The ReflectAI Team</strong></p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            You received this email because you signed up on ReflectAI.<br>
            If you didn’t sign up, please ignore this email.
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendWelcomeEmail };
