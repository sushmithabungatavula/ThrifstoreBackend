// verifyRoutes.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Load environment variables (if not already loaded in your app)
// If you're using a .env file in development, ensure you have: require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;    // e.g., 'AC...'
const apiKey = process.env.TWILIO_API_KEY;            // e.g., 'SK...'
const apiSecret = process.env.TWILIO_API_SECRET;      // e.g., 'Ihp7X8wl...'
const verifyServiceSid = process.env.VERIFY_SERVICE_SID; // e.g., 'VAe585f...'

const client = twilio(apiKey, apiSecret, { accountSid });


router.post('/start-verify', async (req, res) => {
  try {
    const { to, channel = 'sms', locale = 'en' } = req.body;

    if (!to || !to.trim()) {
      return res.status(400).json({
        success: false,
        error: "Missing 'to' parameter; please provide a phone number or email.",
      });
    }

    // Send a verification code via Twilio Verify
    const verification = await client.verify
      .services(verifyServiceSid)
      .verifications.create({
        to,
        channel,  // "sms", "call", "whatsapp", "email"
        locale,   // e.g. "en", "hi", "zh", "ja", ...
      });

    console.log(`Sent verification: '${verification.sid}' to '${to}'`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    // If Twilio returns an error status, pass it along; otherwise default to 400
    return res.status(error.status || 400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 *  POST /twilio/check-verify
 *
 *  Example request body:
 *    {
 *      "to": "+91XXXXXXXXXX", // phone number or email
 *      "code": "123456"       // the OTP code entered by user
 *    }
 *  Example response (JSON):
 *    {
 *      "success": true,
 *      "message": "Verification success."
 *    }
 *    or
 *    {
 *      "success": false,
 *      "message": "Incorrect token."
 *    }
 */
router.post('/check-verify', async (req, res) => {
  try {
    const { to, code } = req.body;
    if (!to || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing 'to' or 'code'.",
      });
    }

    // Check the verification code
    const check = await client.verify
      .services(verifyServiceSid)
      .verificationChecks.create({ to, code });

    if (check.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Verification success.',
      });
    }

    // If not approved, code is incorrect or expired
    return res.status(400).json({
      success: false,
      message: 'Incorrect token.',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;