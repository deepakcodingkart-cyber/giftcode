// utils/sendEmail.server.js
import nodemailer from "nodemailer";

/**
 * Send gift card email
 * @param {string} toEmail - recipient email
 * @param {string} recipientName - recipient name
 * @param {string} giftCardCode - gift card code
 * @param {number|string} amount - gift card amount
 * @param {string} fromEmail - sender email
 * 
 */
export async function sendGiftCardEmail({ toEmail, recipientName, giftCardCode, amount, fromEmail }) {

  try {
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Your Shop" <${  fromEmail || process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "🎁 Your Gift Card Is Ready!",
      html: `
        <h2>Hi ${recipientName || "Customer"},</h2>
        <p>Your gift card code:</p>
        <h1 style="color:green;">${giftCardCode}</h1>
        <p>Amount: <b>₹${parseFloat(amount).toFixed(2)}</b></p>
        <p>Use this code at checkout to redeem your gift.</p>
        <br/>
        <p>Best Regards,<br/>Your Store Team</p>
      `
    });

    console.log("📩 Gift card email sent to", toEmail);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
}
