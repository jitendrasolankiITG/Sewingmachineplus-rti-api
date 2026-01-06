import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

/* ✅ CORS – MUST be before routes */
app.use(cors({
  origin: "*",           // Allow all domains
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.post("/check-inventory", async (req, res) => {
  console.log("➡ Incoming body:", req.body);

  const { rtiSKU, rtiVendor, rtiVariant } = req.body;

  if (!rtiSKU) {
    return res.status(400).json({ error: "SKU missing" });
  }

  try {
    // Make POST request to SMP API using axios
    const response = await axios.post(
      "https://smpapi.sewingmachinesplus.com/shopsite_api.asp",
      new URLSearchParams({
        inv_status: "available",
        locale: "en-US",
        storeid: "sewmachshop",
        storeurl: "https://www.sewingmachinesplus.com",
        serialnum: "0001200073",
        basket: "SSMSB1830426161776189727.24068",
        item_total: "1",
        p1sku: rtiSKU,
        p1quantity: "1",
        p1option_total: "0",
        p1type: "T",
        vendor: rtiVendor || "",
        variant: rtiVariant || ""
      }).toString(), // Convert to URL-encoded string
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "NodeJS" // Some servers require User-Agent
        },
        timeout: 15000 // 15 seconds
      }
    );

    // Send SMP API response directly
    res.status(response.status).send(response.data);

  } catch (err) {
    console.error("❌ API Request Failed:", err.message);

    // Axios error handling
    if (err.response) {
      // SMP API responded with error status
      res.status(err.response.status).send(err.response.data);
    } else if (err.code === "ECONNABORTED") {
      // Timeout error
      res.status(504).json({ error: "Timeout", message: "Request took too long" });
    } else {
      // Network or other errors
      res.status(500).json({ error: "Fetch failed", message: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
