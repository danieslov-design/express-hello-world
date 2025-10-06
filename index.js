import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";
const REDIRECT = "https://my-sun-data.onrender.com/callback";

app.get("/", (req, res) => res.send("Servern körs. Prova /callback?code=XYZ"));

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Ingen ?code i URL:en.");

  const payload = {
    appkey: APPKEY,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT
  };

  try {
    const r = await fetch("https://gateway.isolarcloud.com/openapi/apiManage/token", {
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

app.listen(3000, () => console.log("Servern körs på port 3000"));
