import Stripe from 'stripe';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
export const stripeWebhooks = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try{
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                })
                const session = sessionList.data[0];
                const {transactionId , appId} = session.metadata;
                if(appId === 'quickgpt'){
                    // Update the transaction status in your database to 'succeeded'
                    const transaction = await Transaction.findOne({ _id: transactionId , isPaid: false });
                    // update credits in user account
                    await User.updateOne({ _id: transaction.userId }, { $inc: { credits: transaction.credits } });
                    transaction.isPaid = true;
                    await transaction.save();
                }else{
                    return res.json({ received: true , message: 'App ID does not match quickgpt, ignoring event.' });
                }
                break;
            // Handle other event types as needed
            default:
                console.log(`Unhandled event type: ${event.type}`); 
                break;
        }
        res.json({ received: true });
    }
    catch (err) {
        console.log('Error processing webhook event:', err.message);
        return res.status(500).send(`Server Error: ${err.message}`);
    }
    
 
}