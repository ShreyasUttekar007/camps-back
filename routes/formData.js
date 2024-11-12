const express = require("express");
const router = express.Router();
const formData = require("../models/FormData");

router.post("/vote", async (req, res) => {
  try {
    const { option } = req.body;
    const userIp = req.ip;

    if (!option) {
      return res.status(400).json({ error: "Option is required" });
    }

    // Check if the IP address has already voted
    const existingVote = await formData.findOne({ ip: userIp });
    if (existingVote) {
      return res.status(403).json({ error: "You have already voted" });
    }

    // Create a new vote entry with the user's IP address
    const newVote = new formData({ option, ip: userIp });
    await newVote.save();

    res.status(201).json({ message: "Vote recorded successfully", data: newVote });
  } catch (error) {
    res.status(500).json({ error: "Error saving vote", details: error.message });
  }
});


// GET API to check if the user has already voted
router.get("/check-vote", async (req, res) => {
  try {
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const existingVote = await formData.findOne({ ip: userIp });

    if (existingVote) {
      return res.status(200).json({ hasVoted: true });
    }

    res.status(200).json({ hasVoted: false });
  } catch (error) {
    res.status(500).json({ error: "Error checking vote status", details: error.message });
  }
});



router.get("/results", async (req, res) => {
  try {
    const votes = await formData.find({});
    const totalVotes = votes.length;

    // Initial vote counts for specific options
    const initialCounts = {
      "श्री.शंभूराज शिवाजीराव देसाई (शिंदे गट)": 3817,
      "श्री.सत्यजितसिंह विक्रमसिंह पाटणकर": 1094,
      "श्री.भानुप्रताप कदम (ठाकरे गट)": 636,
      NOTA: 108,
      Other: 11,
    };

    // Calculate the current counts based on the database entries
    const optionCount = votes.reduce((acc, vote) => {
      acc[vote.option] = (acc[vote.option] || 0) + 1;
      return acc;
    }, {});

    // Merge initial counts with current counts, adding them together
    for (let option in initialCounts) {
      optionCount[option] = (optionCount[option] || 0) + initialCounts[option];
    }

    // Calculate the new total votes with initial values included
    const newTotalVotes = Object.values(optionCount).reduce(
      (sum, count) => sum + count,
      0
    );

    // Prepare results with percentages and counts
    const results = {};
    for (let option in optionCount) {
      const percentage = ((optionCount[option] / newTotalVotes) * 100).toFixed(
        2
      );
      results[option] = `${percentage}% (${optionCount[option]})`;
    }

    res.status(200).json({
      totalVotes: newTotalVotes,
      results,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error retrieving results", details: error.message });
  }
});

module.exports = router;
