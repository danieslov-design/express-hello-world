import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

// 🔑 Dina Sungrow-nycklar
const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";

// 🌍 EU-specifik redirect
const REDIRECT = "https://express-hello-world-lsql.onrender.com/callback";

// 🔗 Authorization-länk (kopiera denna till webbläsaren)
app.get("/", (req, res) => {
  const authUrl = `https://web3.isolarcloud.eu/#/authorized-app?cloudId=3&applicationId=2012&redirectUrl=${encodeURIComponent(REDIRECT)}`;
  res.send(`<h2>MySunDataV2 – EU-OAuth</h2>
            <p>Klicka här för att auktorisera:</p>
            <a href="${authUrl}" target="_blank">${authUrl}</a>`);
});

// 🪄 Callback från iSolarCloud efter godkännande
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ Ingen ?code i URL:en.");

  const payload = {
    appkey: APPKEY,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT
  };

  try {
    const r = await fetch("https://gateway.isolarcloud.eu/openapi/apiManage/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-key": SECRETKEY
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    console.log("Token response:", data);

    if (data.result_code === "1") {
      res.send(`<pre>✅ Token mottagen!\n\n${JSON.stringify(data.result_data, null, 2)}</pre>`);
    } else {
      res.send(`<pre>❌ Token error:\n\n${JSON.stringify(data, null, 2)}</pre>`);
    }
  } catch (err) {
    res.send(`<pre>Fel vid tokenhämtning: ${err.message}</pre>`);
  }
});

app.listen(3000, () => console.log("🌍 MySunDataV2 (EU) körs på port 3000"));
