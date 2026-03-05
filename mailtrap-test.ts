const nodemailer = require("nodemailer");

// Transporter using Mailtrap credentials
let transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587, // or 2525
  auth: {
    user: "85247f08f27dcc", // your Mailtrap username
    pass: "9e558f91b9a578"   // your Mailtrap password
  }
});

// Send a test email
transporter.sendMail({
  from: "no-reply@example.com", // must be valid format
  to: "test@example.com",       // Mailtrap will capture this
  subject: "Mailtrap Debug Test",
  text: "Hello! This is a test email sent via Mailtrap SMTP."
}, (err, info) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("Message sent:", info.messageId);
  }
});
