require("dotenv").config();
const express = require("express");
const cors = require("cors");

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
app.listen(PORT, () => {
  console.log(`Indoor nav backend running on http://localhost:${PORT}`);
});
