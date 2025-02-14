const googleAuth = (req, res) => {
    const { user, token } = req.user;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // 🔹 Store JWT in cookies
    res.cookie("userToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 3600000, // 1 hour
    });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.redirect("/user/dashboard"); // Redirect user to dashboard after login
};

module.exports=googleAuth;