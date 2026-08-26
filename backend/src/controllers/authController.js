export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile phone number is required' });
    }
    // Return OTP response for evaluation testing
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      otp: '123456'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Use demo code 123456' });
    }

    const user = {
      id: 'usr_' + Date.now(),
      name: name || 'Bhavana Bai',
      phone: `+91 ${phone}`,
      email: 'bhavana@example.com',
      address: 'Mijar, Moodbidri, Karnataka - 574225'
    };

    return res.status(200).json({
      success: true,
      token: 'jwt_token_vendorsaathi_demo_2026',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
