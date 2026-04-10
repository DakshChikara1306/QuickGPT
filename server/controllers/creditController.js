// 🔹 Models
import Transaction from "../models/Transaction.js";

// 🔹 Payment
import Stripe from "stripe";

// =========================================================
// 📦 Static Plans Data
// =========================================================
const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 10,
    credits: 100,
    features: [
      "100 text generations",
      "50 image generations",
      "Standard support",
      "Access to basic models",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    credits: 500,
    features: [
      "500 text generations",
      "200 image generations",
      "Priority support",
      "Access to pro models",
      "Faster response time",
    ],
  },
  {
    _id: "premium",
    name: "Premium",
    price: 30,
    credits: 1000,
    features: [
      "1000 text generations",
      "500 image generations",
      "24/7 VIP support",
      "Access to premium models",
      "Dedicated account manager",
    ],
  },
];

// =========================================================
// 📥 Get All Plans
// =========================================================
export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔐 Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// =========================================================
// 💳 Purchase Plan (Stripe Checkout)
// Creates transaction + returns checkout URL
// =========================================================
export const purchasePlan = async (req, res) => {
  try {
    const { planId } = req.body;

    // 🔹 Auth user
    const userId = req.user._id;

    // 🔍 Find selected plan
    const plan = plans.find((p) => p._id === planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // 🧾 Create transaction (pending payment)
    const transaction = await Transaction.create({
      userId: userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: false, // will be updated after payment success
    });

    // 🌍 Get frontend origin
    const { origin } = req.headers;

    // 💳 Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.price * 100, // cents
            product_data: {
              name: plan.name,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      // 🔁 Redirect URLs
      success_url: `${origin}/loading`,
      cancel_url: `${origin}`,

      // 🔗 Attach metadata for later verification
      metadata: {
        transactionId: transaction._id.toString(),
        appId: "quickgpt",
      },

      // ⏳ Session expiry (30 minutes)
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};