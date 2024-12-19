import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

app.use(cors());
dotenv.config();



const port = process.env.PORT || 8081;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mongoose connection
const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/happyThoughts";

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = Promise;

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB at ${mongoUrl}`);
});

mongoose.connection.on("error", (error) => {
  console.error("Error connecting to MongoDB:", error);
});


const { Schema, model } = mongoose;

// Thought schema
const thoughtSchema = new Schema({
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Thought = model("Thought", thoughtSchema);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Happy Thoughts API!");
});

// Get thoughts (max 20, sorted by createdAt descending)
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: -1 }).limit(20);
    res.json(thoughts);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch thoughts.",
      error: error.message,
    });
  }
});

// Post a new thought
app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const thought = await new Thought({ message }).save();
    res.status(201).json({
      success: true,
      message: "Thought created successfully!",
      data: thought,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not create thought. Please check the input.",
      error: error.message,
    });
  }
});

// Add a like to a thought
app.post("/thoughts/:thoughtId/like", async (req, res) => {
  const { thoughtId } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      thoughtId,
      { $inc: { hearts: 1 } },
      { new: true }
    );

    if (!updatedThought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Like added successfully!",
      data: updatedThought,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not add like.",
      error: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
