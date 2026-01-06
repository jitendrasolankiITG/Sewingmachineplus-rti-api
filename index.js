import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
// Render ke liye PORT hamesha process.env.PORT hona chahiye
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/check-inventory", async (req, res) => {
  const { rtiSKU, rtiVendor, rtiVariant } = req.body;

  if (!rtiSKU) return res.status(400).json({ error: "SKU missing" });

  // 1. Timeout ko badha kar 60 seconds karein (Render free tier slow ho sakta hai)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); 

  try {
    const response = await axios({
      method: "post",
      url: "https://smpapi.sewingmachinesplus.com/shopsite_api.asp",
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
        // Browser jaisa User-Agent taaki block na ho
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "*/*"
      },
      signal: controller.signal,
      timeout: 60000 // Axios level timeout
    });

    clearTimeout(timeoutId);
    res.status(response.status).send(response.data);

  } catch (err) {
    clearTimeout(timeoutId);
    
    // Agar request cancel hui hai (Timeout ki wajah se)
    if (axios.isCancel(err) || err.code === "ECONNABORTED" || err.message === "canceled") {
      console.error("❌ API Timeout on Render");
      return res.status(504).json({ 
        error: "Timeout", 
        message: "SMP API is responding too slowly for Render." 
      });
    }

    console.error("❌ Error Detail:", err.message);
    res.status(500).json({ error: "Fetch failed", message: err.message });
  }
});

// Render ke liye 0.0.0.0 bind karna zaroori hai
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});