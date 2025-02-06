const User=require('../../models/dbuser');
const bcrypt=require('bcrypt');

const loadUsers= async (req, res) => {
    try {
        let searchTerm = req.query.searchUsers?.trim() || "";
        let page = parseInt(req.query.page) || 1; // Get the page number from query, default to 1
        let limit = 5; // Number of users per page
        let skip = (page - 1) * limit; // Calculate how many records to skip

        let query = {};
        if (searchTerm) {
            query = {
                $or: [
                    { fullName: { $regex: new RegExp(searchTerm, "i") } },
                    { email: { $regex: new RegExp(searchTerm, "i") } }
                ]
            };
        }

        const users = await User.find(query).sort({fullName:1}).skip(skip).limit(limit); // Fetch paginated users
        const totalUsers = await User.countDocuments(query); // Count total users matching the search

        res.render("users", {
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            searchTerm
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).send("Internal Server Error");
    }
}

const blockUser= async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Toggle user block status
      user.isActive = !user.isActive;
      await user.save();
  
      res.json({ isActive: user.isActive });    
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

const fetchSearch= async (req, res) => {
    try {
        const searchTerm = req.query.term?.trim();
        if (!searchTerm) return res.json([]); // Empty response if no input

        // Search users by full name or email (case-insensitive)
        const users = await User.find({
            $or: [
                { fullName: { $regex: new RegExp(searchTerm, "i") } },
                { email: { $regex: new RegExp(searchTerm, "i") } }
            ]
        }).limit(5); // Limit results for performance

        res.json(users);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports={
    loadUsers,
    blockUser,
    fetchSearch
}