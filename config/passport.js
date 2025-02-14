const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/dbuser");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });

                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        fullName: profile.displayName,
                        email: profile.emails[0].value,                        
                        isVerified: true
                    });
                    await user.save();
                }

                // 🔹 Generate JWT Token
                const token = jwt.sign(
                    { userId: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                return done(null, { user, token }); // Pass both user and token
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

module.exports = passport;


