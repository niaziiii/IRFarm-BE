import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SERVER_HOST,
      port: 465, // Secure SMTP port number provided by your hosting (commonly 465 or 587)
      // secure: true, // True for 465, false for other ports
      secureConnection: true,
      debug: true,
      auth: {
        user: process.env.EMAIL_USERNAME, // The email account you created in cPanel
        pass: process.env.EMAIL_PASSWORD, // Email account password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email not sent:", error);
  }
};

export default sendEmail;
