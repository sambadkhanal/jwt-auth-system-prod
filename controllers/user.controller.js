import User from "../models/User.model.js";

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit).select("-password");

    res.status(200).json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.log("Error in getUsers controller: ", err.stack);
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msng: "User not found" });
    }

    res.status(200).json({ msng: "User deleted successfully" });
  } catch (err) {
    console.log("Error inside deleteUser controller: ", err.stack);
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msng: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.log("Error inside getProfile controller: ", err.stack);
    return res.status(500).json({ msng: "Internal Server Error" });
  }
};
