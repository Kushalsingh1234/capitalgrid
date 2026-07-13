import { getCompanyPublicProfile } from '../services/profileService.js';

export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getCompanyPublicProfile(id);
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
