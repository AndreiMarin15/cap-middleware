import { viewAccount } from "../services/userServices.js";

export async function viewAccount(req, res) {
  try {
    const response = await viewAccount();
    res.json({
      HI: null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
