import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

// 🔹 Dina nycklar från Developer-portalen
const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";
const REDIRECT = "https://express-hello-world-lsql.onrender.com/callback";

// 🧩 Testa att Render-servern är igång
app.get("/", (req, res) => {
  res.send(`
    <h3>Render-proxy aktiv ✅</h3>
    <p>För att logga in i iSolarCloud klicka här:</p>
    <a href="https://web3.isolarcloud.eu/#/authorized-app?cloudId=3&applicationId=2012&redirectUrl=${encodeURIComponent(REDIRECT)}" target="_blank">
      Auktorisera MySunDataV2
    </a>
  `);
});

// 🔹 1️⃣ Tar emot redirect från iSolarCloud
app.get("/callback", (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Ingen ?code i URL:en 😕");

  res.send(`
    <h3>✅ Callback mottagen</h3>
    <p>Din code är: <b>${code}</b></p>
    <p>Nu kan du byta code mot token här:</p>
    <a href="/getToken?code=${code}">/getToken?code=${code}</a>
  `);
});

// 🔹 2️⃣ Byter code → access_token
app.get("/getToken", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Missing ?code parameter");

 const payload = {
  appkey: APPKEY,
  curPage: 1,
  size: 10,
  sys_code: "901",
  auth_user: 529802  // 👈 lägg till denna
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

// 🔹 3️⃣ Testa token: Hämta stationer
app.get("/getStationList", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing ?token parameter");

  const url = "https://gateway.isolarcloud.eu/openapi/pvm/station/v2/getStationList";
  const payload = { appkey: APPKEY, curPage: 1, size: 10, sys_code: "901" };

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
    console.log("Svar från getStationList:", text);
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 🔹 4️⃣ Hämtar KPI-data för en dag (PV, Load, Buy, Sell)
app.post("/getKpiDay", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing ?token parameter");

  const url = "https://gateway.isolarcloud.eu/openapi/pvm/station/v2/getKpiStationDay";
  const body = {
  ...req.body,
  sys_code: "901",
  auth_user: 529802   // 👈 lägg till även här
};

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "x-access-key": SECRETKEY,
        "sys_code": "901"
      },
      body: JSON.stringify(body)
    });

    const text = await r.text();
    console.log("Svar från getKpiStationDay:", text);
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 🔹 Starta servern
app.listen(3000, () => console.log("✅ Servern körs på port 3000"));
