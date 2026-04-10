// 🔹 Payment
import Stripe from "stripe";

// 🔹 Models
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// =========================================================
// 🔔 Stripe Webhook Handler
// Verifies event and updates transaction + user credits
// =========================================================
export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // 🔐 Verify webhook signature
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(
      "Webhook signature verification failed:",
      err.message
    );

    return res
      .status(400)
      .send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // =====================================================
      // 💳 Payment Success Event
      // =====================================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // 🔍 Get checkout session using payment intent
        const sessionList =
          await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
          });

        const session = sessionList.data[0];

        const { transactionId, appId } = session.metadata;

        // 🔐 Ensure event belongs to this app
        if (appId === "quickgpt") {
          // 🔍 Find pending transaction
          const transaction =
            await Transaction.findOne({
              _id: transactionId,
              isPaid: false,
            });

          // 💳 Add credits to user
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          // ✅ Mark transaction as paid
          transaction.isPaid = true;
          await transaction.save();
        } else {
          return res.json({
            received: true,
            message:
              "App ID does not match quickgpt, ignoring event.",
          });
        }

        break;
      }

      // =====================================================
      // ⚠️ Unhandled Events
      // =====================================================
      default:
        console.log(
          `Unhandled event type: ${event.type}`
        );
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.log(
      "Error processing webhook event:",
      err.message
    );

    return res
      .status(500)
      .send(`Server Error: ${err.message}`);
  }
};