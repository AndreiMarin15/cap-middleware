const userServices = require("../services/userServices.js");

exports.viewAccount = async (req, res) => {
  try {
    const response = await userServices.viewAccount();
    res.json({
      HI: null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
