import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.json({
    message: "health check passed.",
  });
});


app.listen(3000);
