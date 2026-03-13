import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { sendSubscriptionEmail } from "./email.js";
import fs from "fs";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).send("Stripe not configured");
    }
    const signature = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        await activateSubscription({
          userId,
          plan,
          stripeSessionId: session.id,
        });
      }
    }

    res.json({ received: true });
  },
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
}

// ================== UTILITIES ==================

function getLatestEdition(editions = []) {
  if (!Array.isArray(editions) || editions.length === 0) {
    return null;
  }

  return editions
    .slice() // avoid mutating DB data
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}


async function ensureSeedData() {
  const db = await getDb();
  const newspapers = db.collection("newspapers");
  const users = db.collection("users");

  const count = await newspapers.countDocuments();
  if (count === 0) {
    await newspapers.insertMany([
      /* ================= ENGLISH ================= */
      {
        name: "Times Of India",
        language: "English",
        coverImage: "image1.png",
        editions: [
          {
            date: "2026-02-11",
            file: "times-of-india/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "Hindustan Times",
        language: "English",
        coverImage: "image2.jpeg",
        editions: [
          {
            date: "2026-02-11",
            file: "hindustan-times/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "The Asian Age",
        language: "English",
        coverImage: "image3.png",
        editions: [
          {
            date: "2026-02-11",
            file: "the-asian-age/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "The Hindu",
        language: "English",
        coverImage: "image4.jpg",
        editions: [
          {
            date: "2026-02-11",
            file: "the-hindu/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "First India",
        language: "English",
        coverImage: "image5.jpeg",
        editions: [
          {
            date: "2026-02-11",
            file: "first-india/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },

      /* ================= TAMIL ================= */

      {
        name: "Dinamalar",
        language: "Tamil",
        coverImage: "image1.png",
        editions: [
          {
            date: "2026-02-11",
            file: "dinamalar/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "Dina Thanthi",
        language: "Tamil",
        coverImage: "image2.jpeg",
        editions: [
          {
            date: "2026-02-11",
            file: "dina-thanthi/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "Dinamani",
        language: "Tamil",
        coverImage: "image3.png",
        editions: [
          {
            date: "2026-02-11",
            file: "dinamani/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "Maalai Malar",
        language: "Tamil",
        coverImage: "image4.jpg",
        editions: [
          {
            date: "2026-02-11",
            file: "maalai-malar/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
      {
        name: "Thinaboomi",
        language: "Tamil",
        coverImage: "image5.jpeg",
        editions: [
          {
            date: "2026-02-11",
            file: "thinaboomi/2026-02-11.pdf",
          },
        ],
        createdAt: new Date(),
      },
    ]);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await users.findOne({ email: adminEmail });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await users.insertOne({
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        passwordHash,
        role: "admin",
        createdAt: new Date(),
        subscription: {
          active: false,
        },
      });
    }
  }
}

function authMiddleware(requiredRole = "user") {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    try {
      const payload = jwt.verify(token, getJwtSecret());
      req.user = payload;
      if (requiredRole === "admin" && payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

function planToDays(plan) {
  return plan === "Weekly" ? 7 : 30;
}

async function activateSubscription({ userId, plan, stripeSessionId }) {
  const db = await getDb();
  const users = db.collection("users");
  const payments = db.collection("payments");
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return;
  }

  const days = planToDays(plan);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        "subscription.active": true,
        "subscription.plan": plan,
        "subscription.startDate": startDate,
        "subscription.endDate": endDate,
        "subscription.stripeSessionId": stripeSessionId || null,
      },
    },
  );

  const amount = plan === "Weekly" ? 10 : 30;
  await payments.insertOne({
    userId: user._id,
    amount,
    currency: "INR",
    plan,
    stripeSessionId: stripeSessionId || null,
    status: "paid",
    createdAt: new Date(),
  });

  if (user.email) {
    try {
      const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Subscriber";
      await sendSubscriptionEmail({
        to: user.email,
        name,
        plan,
        endDate: endDate.toDateString(),
      });
      console.log("📧 Subscription email sent to:", user.email);
    } catch (err) {
      console.error("❌ Email sending failed:", err.message);
    }
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  const db = await getDb();
  const users = db.collection("users");
  const existing = await users.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    firstName,
    lastName,
    email,
    passwordHash,
    role: "user",
    createdAt: new Date(),
    subscription: {
      active: false,
    },
  });
  const user = await users.findOne({ _id: result.insertedId });
  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
    },
  });
});

app.get("/api/me", authMiddleware(), async (req, res) => {
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ _id: new ObjectId(req.user.id) });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
    },
  });
});

app.get("/api/newspapers", async (req, res) => {
  const language = req.query.language;
  const db = await getDb();
  const newspapers = db.collection("newspapers");
  const query = language ? { language } : {};
  const items = await newspapers.find(query).toArray();
  return res.json({
    newspapers: items.map((item) => ({
      id: item._id,
      name: item.name,
      language: item.language,
      coverImage: item.coverImage,
      downloadId: item._id,
    })),
  });
});

app.get("/api/downloads/:id", authMiddleware(), async (req, res) => {
  const db = await getDb();
  const newspapers = db.collection("newspapers");
  const users = db.collection("users");

  const user = await users.findOne({ _id: new ObjectId(req.user.id) });
  
  // Admins bypass subscription check
  if (user && user.role !== "admin") {
    if (!user.subscription?.active) {
      return res.status(403).json({ message: "Active subscription required" });
    }
    if (
      user.subscription.endDate &&
      new Date(user.subscription.endDate) < new Date()
    ) {
      return res.status(403).json({ message: "Subscription expired" });
    }
  }
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const paper = await newspapers.findOne({ _id: new ObjectId(req.params.id) });
  if (!paper) {
    return res.status(404).json({ message: "Newspaper not found" });
  }

  const latestEdition = getLatestEdition(paper.editions || []);

  if (!latestEdition) {
    return res.status(404).json({ message: "No editions available" });
  }

  const filePath = path.join(__dirname, "downloads", latestEdition.file);

  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    return res
      .status(404)
      .json({ message: "Edition file not found on server" });
  }

  return res.download(filePath, `${paper.name}-${latestEdition.date}.pdf`);
});

app.post("/api/checkout", authMiddleware(), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe not configured" });
  }
  const plan = req.body.plan;
  if (!plan || (plan !== "Weekly" && plan !== "Monthly")) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  const priceId =
    plan === "Weekly"
      ? process.env.STRIPE_PRICE_WEEKLY
      : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    return res.status(500).json({ message: "Stripe price not configured" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_BASE_URL}/subscription.html?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_BASE_URL}/subscription.html?cancel=1`,
    metadata: {
      userId: req.user.id,
      plan,
    },
  });

  return res.json({ url: session.url });
});

app.post("/api/subscriptions/activate", authMiddleware(), async (req, res) => {
  const plan = req.body.plan;
  if (!plan || (plan !== "Weekly" && plan !== "Monthly")) {
    return res.status(400).json({ message: "Invalid plan" });
  }
  await activateSubscription({
    userId: req.user.id,
    plan,
    stripeSessionId: null,
  });
  return res.json({ message: "Subscription activated" });
});

app.post("/api/subscriptions/cancel", authMiddleware(), async (req, res) => {
  const db = await getDb();
  const users = db.collection("users");
  await users.updateOne(
    { _id: new ObjectId(req.user.id) },
    {
      $set: {
        "subscription.active": false
      }
    }
  );
  return res.json({ message: "Subscription canceled" });
});

app.get("/api/admin/users", authMiddleware("admin"), async (req, res) => {
  const db = await getDb();
  const users = db.collection("users");
  const items = await users.find({ role: "user" }).toArray();
  return res.json({
    users: items.map((user) => ({
      id: user._id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      subscription: user.subscription || { active: false },
    })),
  });
});

app.patch(
  "/api/admin/users/:id/subscription",
  authMiddleware("admin"),
  async (req, res) => {
    const { active } = req.body;
    const db = await getDb();
    const users = db.collection("users");
    const target = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    await users.updateOne(
      { _id: target._id },
      {
        $set: {
          "subscription.active": Boolean(active),
        },
      },
    );
    return res.json({ message: "Subscription updated" });
  },
);

app.get("/api/admin/metrics", authMiddleware("admin"), async (req, res) => {
  const db = await getDb();
  const payments = db.collection("payments");
  const result = await payments
    .aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();
  const totalRevenue = result.length ? result[0].total : 0;
  return res.json({ totalRevenue });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

ensureSeedData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
  });
