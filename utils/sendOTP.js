const nodemailer = require("nodemailer");

const sendOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail ID
            pass: process.env.EMAIL_PASS  // Your Gmail App Password
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "CRUX : Your OTP for Signup Verification",
        text: `Your OTP for CRUX account verification is: ${otp}. It is valid for 1 minute.`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendOTP;