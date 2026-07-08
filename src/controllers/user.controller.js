const User = require("../models/Users");
class userController {
  getMe = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password -role");
    return res.status(200).json({ success: true, data: user });
  };

  updateMe = async (req, res) => {
    // حزام أمان: نأخذ فقط الحقول المسموح للزبون تعديلها
    const { name, email, phone, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, address },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  };
  getAllUsers = async (req, res) => {
    const users = await User.find().select("-password -role");
    return res
      .status(200)
      .json({ success: true, count: users.length, data: users });
  };

  getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select("-password -role");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  };
  deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  };
}
module.exports = new userController();
