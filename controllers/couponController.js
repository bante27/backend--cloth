const Subscriber = require('../models/Subscriber');
const Coupon = require('../models/Coupon');
const { sendWelcomeEmail } = require('../utils/sendEmail');

// @desc    Subscribe and Issue Coupon
// @route   POST /api/coupons/subscribe
exports.subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email field is strictly required.' });
    }

    // Check if the user is already on the list
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already registered. | ይህ ኢሜይል ቀድሞ ተመዝግቧል።' });
    }

    // 1. Save new subscriber
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    // 2. Dynamically build a clean unique coupon code (e.g., HW15-X92B)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const discountAmount = 15; // 15% discount
    const uniqueCouponCode = `HW${discountAmount}-${randomSuffix}`;

    // 3. Persist coupon constraints in the DB
    const newCoupon = new Coupon({
      code: uniqueCouponCode,
      discountPercentage: discountAmount,
      associatedEmail: email,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days expiration
    });
    await newCoupon.save();

    // 4. FIX: Send the welcome email with the EXACT generated code passed directly
    try {
      await sendWelcomeEmail(email, uniqueCouponCode, discountAmount);
      console.log(`✉️ Welcome email dispatched to ${email} with code: ${uniqueCouponCode}`);
    } catch (emailError) {
      console.error('Email Delivery Engine Failed:', emailError);
      // We don't crash the request if the email host is down; user is still saved.
    }

    return res.status(201).json({
      success: true,
      message: 'Subscription successful! Check your inbox. | በተሳካ ሁኔታ ተመዝግበዋል! ኢሜይልዎን ያረጋግጡ።'
    });

  } catch (error) {
    console.error('Subscription Endpoint Error:', error);
    return res.status(500).json({ message: 'Server synchronization failure.' });
  }
};

// @desc    Verify Coupon at Cart Checkout
// @route   POST /api/coupons/verify
exports.verifyCoupon = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ message: 'Coupon code and user email are both required.' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code. | ትክክለኛ ያልሆነ የኩፖን ኮድ።' });
    }

    if (coupon.isUsed) {
      return res.status(400).json({ message: 'This coupon code has already been claimed. | ይህ ኩፖን ቀድሞ ጥቅም ላይ ውሏል።' });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'This coupon has expired. | ይህ ኩፖን ጊዜው አልፎበታል።' });
    }

    if (coupon.associatedEmail !== email.toLowerCase().trim()) {
      return res.status(403).json({ message: 'This coupon is exclusively linked to another account. | ይህ ኩፖን የሌላ ሰው ነው።' });
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon code applied cleanly!',
      discountPercentage: coupon.discountPercentage
    });

  } catch (error) {
    console.error('Coupon Verification Error:', error);
    return res.status(500).json({ message: 'Internal validation failure.' });
  }
};