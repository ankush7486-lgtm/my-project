// Setup Environment Variables (replace with your actual MongoDB connection string)
// You would normally use a .env file and 'dotenv' package, but for simplicity, we define it here.
const MONGODB_URI = 'mongodb://localhost:27017/bank_transfer_db';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_insecure_key'; // Load from environment variable
// IMPORTANT: In a real environment, you MUST set the JWT_SECRET environment variable.

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- 1. Mongoose Setup and User Schema ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// --- 2. Express Setup ---
const app = express();
const PORT = 3000;
app.use(express.json());

// --- 3. JWT Authentication Middleware ---
const verifyToken = (req, res, next) => {
    // Get token from the header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// --- 4. Auth Routes ---

// Register (Create a new user/account)
app.post('/register', async (req, res) => {
    try {
        const { name, username, password, initialBalance } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: "Name, username, and password are required." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            username,
            password: hashedPassword,
            balance: initialBalance || 1000 // Default balance for new accounts
        });
        await user.save();

        res.status(201).json({
            message: "User created successfully. Use /login to get a JWT.",
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// Login (Get a JWT token)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            userId: user._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login." });
    }
});


// --- 5. Test/Setup Route (Matching expected output screenshot) ---
app.post('/create-users', async (req, res) => {
    try {
        // Clear existing users for a clean run
        await User.deleteMany({});

        const aliceData = { name: "Alice", username: "alice_test", password: await bcrypt.hash("securepass", 10), balance: 1000 };
        const bobData = { name: "Bob", username: "bob_test", password: await bcrypt.hash("securepass", 10), balance: 500 };

        const alice = await User.create(aliceData);
        const bob = await User.create(bobData);

        const users = [alice, bob].map(u => ({
            name: u.name,
            balance: u.balance,
            _id: u._id,
            __v: u.__v
        }));

        res.status(201).json({
            message: "Users created",
            users: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during user creation." });
    }
});


// --- 6. Core Transfer Route (Protected) ---
app.post('/transfer', verifyToken, async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;

    // Basic Input Validation
    if (!fromUserId || !toUserId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid transfer details (fromUserId, toUserId, and amount > 0 are required).' });
    }

    // Check if the authenticated user is the sender (Basic security check)
    if (req.user.id !== fromUserId) {
        // Note: For a real app, the server would infer the sender ID from the token, not rely on the request body.
        return res.status(403).json({ message: 'Forbidden. You can only transfer funds from your own account.' });
    }

    // Convert amount to integer/float
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount)) {
        return res.status(400).json({ message: 'Amount must be a number.' });
    }

    // --- NON-TRANSACTIONAL CORE LOGIC ---

    // 1. Atomically check sender's balance and update (debit) in one single database operation.
    // This is the most critical step to prevent race conditions that lead to over-drafting.
    let senderAfterUpdate;
    try {
        senderAfterUpdate = await User.findOneAndUpdate(
            { _id: fromUserId, balance: { $gte: transferAmount } }, // Condition: ID matches AND balance >= amount
            { $inc: { balance: -transferAmount } },               // Action: Decrement balance
            { new: true }                                         // Return the updated document
        );
    } catch (error) {
        console.error("Sender debit error:", error);
        return res.status(500).json({ message: "An error occurred while attempting to debit the sender." });
    }


    if (!senderAfterUpdate) {
        // Check if the failure was due to account existence or insufficient funds
        const senderExists = await User.findById(fromUserId);
        if (!senderExists) {
            return res.status(404).json({ message: "Sender account not found." });
        }
        // If the sender exists but the update failed, it means the balance condition { $gte: amount } failed.
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 2. Update receiver's balance (credit).
    let receiverAfterUpdate;
    try {
        receiverAfterUpdate = await User.findByIdAndUpdate(
            toUserId,
            { $inc: { balance: transferAmount } },
            { new: true }
        );
    } catch (error) {
        // Log this, as it's a serious failure in a non-transactional system.
        console.error("Receiver credit error:", error);
        // CRITICAL: Since the sender was debited successfully, if the receiver fails, we must manually refund the sender.
        // This is manual compensation logic.
        await User.findByIdAndUpdate(fromUserId, { $inc: { balance: transferAmount } }); // Refund the sender
        return res.status(500).json({ message: "Receiver account update failed. Sender was refunded. Check toUserId." });
    }

    // 3. Final Checks and Success Response
    if (!receiverAfterUpdate) {
        // This means the toUserId was invalid/not found after the sender was successfully debited.
        // We must refund the sender here too.
        await User.findByIdAndUpdate(fromUserId, { $inc: { balance: transferAmount } }); // Refund the sender
        return res.status(404).json({ message: "Receiver account not found. Transfer failed and sender debited amount was refunded." });
    }

    // Success
    res.status(200).json({
        message: `Transferred $${transferAmount} from ${senderAfterUpdate.name} to ${receiverAfterUpdate.name}.`,
        senderBalance: senderAfterUpdate.balance,
        receiverBalance: receiverAfterUpdate.balance
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
