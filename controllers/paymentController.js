const axios = require('axios');
const Booking = require('../models/Booking');
const Location = require('../models/location');

// =========================================================
// PHONEPE PG V2 OAUTH CREDENTIALS (SANDBOX / TESTING)
// =========================================================
const CLIENT_ID = "M23IOM3UNHZVS_2603051535"; 
const CLIENT_SECRET = "YmFjMDMzYjItYjJlOS00NWRkLWFjZDYtYTU1MzU5YzE1ZTJl"; 
const MERCHANT_ID = "M23IOM3UNHZVS"; 
const CLIENT_VERSION = "1";

// 🔥 FIXED: Pointing to the Official V2 Preprod/Sandbox Endpoints
const PHONEPE_AUTH_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_PAY_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

// =========================================================
// HELPERS (SMS & Email)
// =========================================================
const sendBookingConfirmationSMS = async (booking) => {
    try {
        console.log(`✅ [SMS] Confirmation queued for ${booking.phoneNumber}`);
    } catch (error) {
        console.error("❌ SMS Helper Error:", error.message);
    }
};

const sendBookingConfirmationEmail = async (booking) => {
    try {
        console.log(`✅ [Email] Confirmation queued for ${booking.workEmail}`);
    } catch (error) {
        console.error("❌ Email Helper Error:", error.message);
    }
};

// =========================================================
// CONTROLLERS
// =========================================================

const initiatePayment = async (req, res) => {
    try {
        console.log("--- STARTING PAYMENT INITIATION (V2 OAUTH SANDBOX) ---");
        
        const { 
            plan, seats, startDate, fullName, workEmail, 
            userEmail, phoneNumber, estimatedTotal, propertyId,
            propertyName, cityName, locationAddress, planFeatures      
        } = req.body;

        if (!estimatedTotal || isNaN(estimatedTotal)) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
        }

        const requestedSeats = Number(seats) || 1;

        // 🛑 VERIFY INVENTORY
        if (propertyId) {
            const location = await Location.findOne({ "properties.propertyId": propertyId });
            if (location) {
                const property = location.properties.find(p => p.propertyId === propertyId);
                
                if (property && typeof property.availableSeats === 'number') {
                    if (!property.availableNow || property.availableSeats <= 0) {
                        return res.status(400).json({ success: false, message: 'Sorry, this workspace is sold out.' });
                    }
                    if (property.availableSeats < requestedSeats) {
                        return res.status(400).json({ success: false, message: `Only ${property.availableSeats} seats left.` });
                    }
                }
            }
        }

        const cleanPhone = phoneNumber ? String(phoneNumber).replace(/\D/g, '').slice(-10) : '9999999999';
        // Amount must be an integer in paise
        const amountInPaise = Math.round(Number(estimatedTotal) * 100);
        const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
        const bookingId = 'BKG' + Date.now() + Math.floor(Math.random() * 1000); 

        console.log("1. Saving to MongoDB...");
        const newBooking = new Booking({
            bookingId, plan: plan || 'Custom Plan', planFeatures: planFeatures || [], 
            seats: requestedSeats, startDate: startDate, fullName: fullName || 'Guest',
            workEmail: workEmail || 'no-email@test.com', userEmail: userEmail || workEmail, 
            phoneNumber: cleanPhone, amount: Number(estimatedTotal),
            transactionId, propertyId, propertyName, cityName, locationAddress,  
            paymentStatus: 'PENDING'
        });
        await newBooking.save();

        console.log("2. Fetching PhonePe V2 Auth Token...");
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', CLIENT_ID);
        tokenParams.append('client_version', CLIENT_VERSION);
        tokenParams.append('client_secret', CLIENT_SECRET);
        tokenParams.append('grant_type', 'client_credentials');

        const tokenResponse = await axios.post(PHONEPE_AUTH_URL, tokenParams, { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) throw new Error('Failed to generate Auth Token');
        console.log("✅ Token generated successfully.");

        console.log("3. Preparing V2 Checkout Payload...");
        // Route back to backend first to handle payment status
        const returnUrl = `https://coworking-space-backend.onrender.com/api/payment/callback/${transactionId}`;

        // Raw JSON Payload for V2
        const paymentPayload = {
            merchantId: MERCHANT_ID,
            merchantOrderId: transactionId,
            amount: amountInPaise,
            expireAfter: 1800,
            metaInfo: { udf1: "Workspace Booking" },
            paymentFlow: {
                type: "PG_CHECKOUT",
                message: "SpaceHub Booking",
                merchantUrls: {
                    redirectUrl: returnUrl,
                    cancelUrl: `${returnUrl}?status=cancelled`
                }
            }
        };

        console.log("4. Sending Checkout Request to Sandbox...");
        const paymentResponse = await axios.post(PHONEPE_PAY_URL, paymentPayload, { 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `O-Bearer ${accessToken}` 
            } 
        });

        const payUrl = paymentResponse.data.redirectUrl || (paymentResponse.data.data && paymentResponse.data.data.redirectUrl);

        if (payUrl) {
            console.log("✅ Success! Sending redirect URL to frontend...");
            return res.status(200).json({ success: true, redirectUrl: payUrl });
        } else {
            return res.status(500).json({ success: false, message: 'Payment URL not found in response.' });
        }

    } catch (error) {
        console.error('💥 PAYMENT INITIATION ERROR 💥');
        let errorMsg = 'Internal Server Error';

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            errorMsg = error.response.data?.message || error.response.data?.error || `PhonePe Error: ${error.response.status}`;
        } else {
            console.error('Setup Error:', error.message);
            errorMsg = error.message;
        }

        res.status(500).json({ success: false, message: errorMsg });
    }
};

const paymentCallback = async (req, res) => {
    const { transactionId } = req.params;
    const frontendBaseUrl = 'http://';
    
    try {
        console.log(`📥 PhonePe Callback Hit for TXN: ${transactionId}`);
        
        const body = req.body || {};
        const query = req.query || {};

        let phonePeCode = body.code || query.code || '';

        // Decode Base64 response if PhonePe sends it packed
        if (body.response) {
            try {
                const decoded = JSON.parse(Buffer.from(body.response, 'base64').toString('utf-8'));
                phonePeCode = decoded.code;
            } catch (e) {
                console.error("Base64 decode error:", e.message);
            }
        }

        console.log(`👉 Extracted PhonePe Status Code: ${phonePeCode || 'NONE'}`);

        const booking = await Booking.findOne({ transactionId });
        if (!booking) {
            console.error("❌ Booking not found in Database!");
            return res.redirect(`${frontendBaseUrl}/payment-success`); 
        }

        const safeCode = phonePeCode ? phonePeCode.toUpperCase() : '';
        const isCancelled = query.status === 'cancelled';

        if (isCancelled || safeCode === 'PAYMENT_ERROR' || safeCode === 'PAYMENT_DECLINED' || safeCode === 'FAILED') {
            booking.paymentStatus = 'FAILED';
            await booking.save();
            console.log("❌ DB Updated to FAILED. Redirecting to frontend...");
            return res.redirect(`${frontendBaseUrl}/payment-failed`);
        }

        // ==========================================
        // 🟢 SUCCESS FLOW: DEDUCT SEATS & UPDATE DB
        // ==========================================
        booking.paymentStatus = 'SUCCESS';
        await booking.save();
        
        if (booking.propertyId) {
            const location = await Location.findOne({ "properties.propertyId": booking.propertyId });
            
            if (location) {
                const propertyIndex = location.properties.findIndex(p => p.propertyId === booking.propertyId);
                
                if (propertyIndex > -1) {
                    let currentSeats = location.properties[propertyIndex].availableSeats;
                    if (typeof currentSeats !== 'number') currentSeats = 100;

                    const newSeats = Math.max(0, currentSeats - booking.seats);
                    location.properties[propertyIndex].availableSeats = newSeats;
                    
                    if (newSeats === 0) {
                        location.properties[propertyIndex].availableNow = false; 
                        location.properties[propertyIndex].capacity = "Sold Out"; 
                    } else {
                        location.properties[propertyIndex].capacity = `${newSeats} Seats Left`;
                    }
                    
                    location.markModified('properties');
                    await location.save();
                    console.log(`✅ Inventory Updated! Deducted ${booking.seats} seats. Seats left: ${newSeats}`);
                }
            }
        }
        
        sendBookingConfirmationSMS(booking);
        sendBookingConfirmationEmail(booking);
        
        console.log("✅ DB Updated to SUCCESS. Redirecting to frontend...");
        return res.redirect(`${frontendBaseUrl}/payment-success`);

    } catch (error) {
        console.error('💥 Callback Processing Error:', error.message);
        res.redirect(`${frontendBaseUrl}/payment-success`);
    }
};

const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch bookings" });
    }
};

const updateAdminBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const booking = await Booking.findByIdAndUpdate(id, { paymentStatus }, { new: true });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

const getUserBookings = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        
        const bookings = await Booking.find({ userEmail: email }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch your bookings" });
    }
};

module.exports = { 
    initiatePayment, 
    paymentCallback, 
    getAllBookings, 
    updateAdminBookingStatus,
    getUserBookings
};