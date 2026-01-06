import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration
app.use(cors({
  origin: "*", 
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.post("/check-inventory", async (req, res) => {
  console.log("➡ Incoming request for SKU:", req.body.rtiSKU);

  const { rtiSKU, rtiVendor, rtiVariant } = req.body;

  if (!rtiSKU) {
    return res.status(400).json({ error: "SKU missing" });
  }

  // Use AbortController to handle timeouts cleanly
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000); // 40 second limit

  try {
    const response = await axios({
      method: "post",
      url: "https://smpapi.sewingmachinesplus.com/shopsite_api.asp",
      // Use URLSearchParams for application/x-www-form-urlencoded
      data: new URLSearchParams({
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
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Using a real browser User-Agent can prevent timeouts caused by bot-blocking
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log("✅ API Success:", response.status);
    
    // Return the response from the SMP API
    res.status(response.status).send(response.data);

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError' || err.code === "ECONNABORTED") {
      console.error("❌ Request Timed Out after 40s");
      return res.status(504).json({ 
        error: "Timeout", 
        message: "The external inventory server is taking too long to respond." 
      });
    }

    if (err.response) {
      // The server responded with a status code outside the 2xx range
      console.error("❌ SMP API Error:", err.response.status);
      return res.status(err.response.status).send(err.response.data);
    } 

    console.error("❌ Connection Error:", err.message);
    res.status(500).json({ 
      error: "Fetch failed", 
      message: err.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});