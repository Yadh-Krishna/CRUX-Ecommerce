const User=require('../../models/userModel');
const bcrypt=require('bcrypt');
const asyncHandler=require('express-async-handler');

const loadUsers=  asyncHandler(async (req, res) => {
    let { search = "", status = "Show all", limit = 20, page = 1 } = req.query;
    
    limit = parseInt(limit);
    page = parseInt(page);

    const query = {};

    // Status Filtering
    if (status === "Active") query.isActive = true;
    if (status === "Disabled") query.isActive = false;

    // Search Filtering
    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    // Fetch Users with Pagination
    const [users, totalUsers] = await Promise.all([
        User.find(query).sort({ fullName: 1 }).limit(limit).skip((page - 1) * limit),
        User.countDocuments(query)
    ]);

    res.render("users", {
        users,
        totalUsers,
        currentPage: page,
        limit,
        search,
        status
    });
});


const blockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        req.flash("error", "User not found");
        return res.status(404).json({ message: "User not found" });
    }

    // Toggle user block status
    user.isActive = !user.isActive;
    await user.save();

    req.flash("success", `User ${user.isActive ? "unblocked" : "blocked"} successfully`);
    res.json({ isActive: user.isActive });
});

module.exports={
    loadUsers,
    blockUser,
}