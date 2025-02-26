const nodemailer = require("nodemailer");

const sendOTP = async (email, otp, purpose) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail ID
            pass: process.env.EMAIL_PASS  // Your Gmail App Password
        }
    });

    // Set email subject & text dynamically based on purpose
    let subject, text;
    if (purpose === "signup") {
        subject = "CRUX : Your OTP for Signup Verification";
        text = `Your OTP for CRUX account verification is: ${otp}. It is valid for 1 minute.`;
    } else if (purpose === "reset-password") {
        subject = "CRUX : Your OTP for Password Reset";
        text = `Your OTP for resetting your password is: ${otp}. It is valid for 1 minute.`;
    }else if (purpose === "verify-email"){
        subject = "CRUX : Your OTP for Email Verification";
        text = `Your OTP for emailverification  is: ${otp}. It is valid for 1 minute.`;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text
    };

    await transporter.sendMail(mailOptions);
};

// const sendOTP = async (email, otp) => {
//     const transporter = nodemailer.createTransport({
//         service: "Gmail",
//         auth: {
//             user: process.env.EMAIL_USER, // Your Gmail ID
//             pass: process.env.EMAIL_PASS  // Your Gmail App Password
//         }
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "CRUX : Your OTP for Signup Verification",
//         text: `Your OTP for CRUX account verification is: ${otp}. It is valid for 1 minute.`
//     };

//     await transporter.sendMail(mailOptions);
// };

module.exports = sendOTP;