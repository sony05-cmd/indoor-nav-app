require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const buildingsRouter = require("./routes/buildings");
const nodesRouter = require("./routes/nodes");
const edgesRouter = require("./routes/edges");
const navigateRouter = require("./routes/navigate");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "indoor-nav-backend" });
});

app.use("/api/buildings", buildingsRouter);
app.use("/api/nodes", nodesRouter);
app.use("/api/edges", edgesRouter);
app.use("/api/navigate", navigateRouter);

const PORT = process.env.PORT || 4000;

// Connect to MongoDB first, then start accepting HTTP requests. If the
// connection fails (bad URI, wrong password, IP not whitelisted), the
// server exits immediately with a clear error instead of silently
// serving requests that would fail on every database call.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Indoor nav backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });