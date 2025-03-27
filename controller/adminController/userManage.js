const User=require('../../models/userModel');
const bcrypt=require('bcrypt');
const asyncHandler=require('express-async-handler');

const loadUsers=  asyncHandler(async (req, res) => {
    let { search = "", status = "Show all", limit = 10, page = 1 } = req.query;
    
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

const liveSearchUsers = asyncHandler(async (req, res) => {
    try {
      let search = req.query.search || "";
      let status = req.query.status || "";
      let limit = parseInt(req.query.limit) || 10;
      let page = parseInt(req.query.page) || 1;
      let skip = (page - 1) * limit;
  
      let filter = {};
  
      if (search) {
        filter.fullName = { $regex: search, $options: "i" }; // Case-insensitive name search
      }
  
      if (status === "Active") {
        filter.isActive = true;
      } else if (status === "Disabled") {
        filter.isActive = false;
      }
  
      let users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      };
  
      let formattedUsers = users.map((user) => ({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        image: user.image || "/assets/imgs/default-user.jpg",
        formattedDate: formatDate(user.createdAt),
      }));
  
      let totalUsers = await User.countDocuments(filter);
      let totalPages = Math.ceil(totalUsers / limit);
  
      res.json({ users: formattedUsers, totalPages, currentPage: page });
    } catch (error) {
      console.error("Error in live search:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
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
    liveSearchUsers
}