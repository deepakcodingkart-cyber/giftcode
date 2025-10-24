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
      from: `"Your Shop" <${fromEmail || process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "🎁 Your Gift Card Is Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
          <h2 style="color:#333;">Hi ${recipientName || "Customer"},</h2>
          <p>Your gift card code:</p>
          <h1 style="color:green; font-size:32px;">${giftCardCode}</h1>
          <p>Amount: <strong>₹${parseFloat(amount).toFixed(2)}</strong></p>
          <p style="margin:20px 0;">
            <a href="https://shop-with-liquid-dashboard.myshopify.com/pages/joy-subscription" 
               target="_blank"
               style="display:inline-block; padding:12px 24px; background-color:#28a745; color:white; text-decoration:none; font-weight:bold; border-radius:6px;">
               Redeem Your Gift Card
            </a>
          </p>
          <p>Use this code at checkout to redeem your gift.</p>
          <br/>
        </div>
      `
    });

    console.log("📩 Gift card email sent to", toEmail);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
}
