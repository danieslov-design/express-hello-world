import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";

// ✅ Testa att Render körs
app.get("/", (req, res) => res.send("Render-proxy aktiv – använd /getStationList?token=XYZ"));

// 🔹 Proxy som tar emot anrop från Google Apps Script
app.get("/getStationList", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing ?token parameter");

const url = "https://gateway.isolarcloud.com/openapi/pvm/station/v2/getStationList";
  const payload = { appkey: APPKEY, curPage: 1, size: 10 };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "x-access-key": SECRETKEY,
        "sys_code": "901"
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => console.log("Servern körs på port 3000"));
