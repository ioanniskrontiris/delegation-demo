console.log("Booting tool-server…");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.get("/echo", (req, res) => {
  const msg = req.query.msg || "";
  res.json({ ok: true, echo: String(msg) });
});
app.listen(9090, () => console.log("Tool server listening on :9090"));