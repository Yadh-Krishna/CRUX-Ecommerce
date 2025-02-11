

module.exports = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        req.flash("error", "Please log in to continue.");
        res.redirect("/admin/login");
    }
};