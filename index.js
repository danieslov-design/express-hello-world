import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

// 🔹 DINA NYCKLAR FRÅN DEVELOPER-PORTALEN
const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";

// 🔹 EU-gateway (korrekt server)
const BASE_URL = "https://eu-gateway.isolarcloud.com/openapi";

// 🔹 Redirect som står registrerad i Developer-portalen
const REDIRECT = "https://express-hello-world-lsql.onrender.com/callback";

// ======================================================
// ✅ Startsida
// ======================================================
app.get("/", (req, res) => {
  res.send(`
    <h2>☀️ MySunData – EU Proxy aktiv</h2>
    <p>Klicka här för att auktorisera appen:</p>
    <a href="https://web3.isolarcloud.eu/#/authorized-app?cloudId=3&applicationId=2012&redirectUrl=${encodeURIComponent(
      REDIRECT
    )}">Auktorisera MySunData</a>
  `);
});

// ======================================================
// 🔹 Callback – tar emot ?code= från iSolarCloud
// ======================================================
app.get("/callback", (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Ingen ?code i URL:en 😕");

  res.send(`
    <h3>✅ Callback mottagen</h3>
    <p>Din code är: <b>${code}</b></p>
    <p>Byt code mot token här:</p>
    <a href="/getToken?code=${code}">/getToken?code=${code}</a>
  `);
});

// ======================================================
// 🔹 Code → Access token
// ======================================================
app.get("/getToken", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing ?code parameter");

  const payload = {
    appkey: APPKEY,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT,
  };

  try {
    const r = await fetch(`${BASE_URL}/apiManage/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-key": SECRETKEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.send(
        `<pre>❌ Kunde inte tolka svaret:\n${text}</pre>`
      );
    }

    if (data.result_code === "1") {
      res.send(
        `<pre>✅ Token mottagen!\n\n${JSON.stringify(
          data.result_data,
          null,
          2
        )}</pre>`
      );
    } else {
      res.send(
        `<pre>❌ Token error:\n\n${JSON.stringify(data, null, 2)}</pre>`
      );
    }
  } catch (err) {
    res.send(`<pre>❌ Fetch-fel: ${err.message}</pre>`);
  }
});

// ======================================================
// 🔹 Förnyelse av token (används av Google Sheets senare)
// ======================================================
app.get("/refreshToken", async (req, res) => {
  const refresh = req.query.refresh;
  if (!refresh) return res.status(400).send("Missing ?refresh parameter");

  const payload = { appkey: APPKEY, refresh_token: refresh };

  try {
    const r = await fetch(`${BASE_URL}/apiManage/refreshToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-key": SECRETKEY,
      },
      body: JSON.stringify(payload),
    });

    res.type("application/json").send(await r.text());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ======================================================
// 🔹 Hämta KPI-data (för /getKpiStationDay)
// ======================================================
app.get("/getKpiStationDay", async (req, res) => {
  const token = req.query.token;
  const station = req.query.station;
  const date = req.query.date;

  if (!token || !station || !date)
    return res
      .status(400)
      .send("Missing ?token, ?station or ?date parameter");

  const payload = {
    appkey: APPKEY,
    stationCodes: [station],
    collectTime: date,
  };

  try {
    const r = await fetch(
      `${BASE_URL}/pvm/station/v2/getKpiStationDay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          "x-access-key": SECRETKEY,
          sys_code: "901",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await r.text();
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ======================================================
// 🔹 Starta servern på Render
// ======================================================
app.listen(3000, () => console.log("✅ EU-servern körs på port 3000"));
