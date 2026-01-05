import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/check-inventory", async (req, res) => {
    const { rtiSKU, rtiVendor, rtiVariant } = req.body;

    if (!rtiSKU) {
        return res.status(400).json({ error: "SKU required" });
    }

    try {
        const response = await fetch(
            "https://smpapi.sewingmachinesplus.com/shopsite_api.asp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    inv_status: "available",
                    locale: "en-US",
                    storeid: "sewmachshop",
                    storeurl: "https://www.sewingmachinesplus.com",
                    serialnum: "0001200073",
                    basket: "SSMSB1830426161776189727.24068",
                    item_total: 1,
                    p1sku: rtiSKU,
                    p1quantity: 1,
                    p1option_total: 0,
                    p1type: "T",
                    vendor: rtiVendor || "",
                    variant: rtiVariant || ""
                })
            }
        );

        const text = await response.text();
        res.status(response.status).send(text);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
