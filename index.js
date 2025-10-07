import express from "express";
import fetch from "node-fetch-native";

const app = express();
app.use(express.json());

// 🔹 Dina Sungrow-uppgifter
const APPKEY = "3F7BBE61DA43549D97CA19D1AC87C524";
const SECRETKEY = "3uytqcjy6ciw7e4p1kufd16pz55uzgu7";
const REDIRECT = "https://express-hello-world-lsql.onrender.com/callback";

// 🔹 Fast auth_user från token
const AUTH_USER = 529802; // Din användar-ID i Sungrow

// ===============================================================
// 🧩 0️⃣ Start — Render aktiv
// ===============================================================
app.get("/", (req, res) => {
  res.send(`
    <h3>Render-proxy aktiv ✅</h3>
    <p>Klicka för att auktorisera iSolarCloud:</p>
    <a href="https://web3.isolarcloud.eu/#/authorized-app?cloudId=3&applicationId=2012&redirectUrl=${encodeURIComponent(
      REDIRECT
    )}" target="_blank">Auktorisera MySunDataV2</a>
    <br><br>
    <p>Testa att Render når EU-servern här:</p>
    <a href="/pingEU" target="_blank">/pingEU</a>
  `);
});

// ===============================================================
// 🧩 1️⃣ Callback — tar emot authorization code
// ===============================================================
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

// ===============================================================
// 🧩 2️⃣ Code → Token
// ===============================================================
app.get("/getToken", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Missing ?code parameter");

  const payload = {
    appkey: APPKEY,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT,
  };

  try {
    const r = await fetch(
      "https://gateway.isolarcloud.com/openapi/apiManage/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-key": SECRETKEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await r.json();
    console.log("Token response:", data);

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
    res.send(`<pre>Fel vid tokenhämtning: ${err.message}</pre>`);
  }
});

// ===============================================================
// 🧩 3️⃣ Test — kontrollera kontakt med EU-gateway
// ===============================================================
app.get("/pingEU", async (req, res) => {
  try {
    const r = await fetch("https://eu-gateway.isolarcloud.com", { method: "GET" });
    res.send(`✅ Nådde EU-gateway: ${r.statusText}`);
  } catch (err) {
    res.send(`❌ Kunde inte nå EU-gateway: ${err.message}`);
  }
});

// ===============================================================
// 🧩 4️⃣ Lista stationer
// ===============================================================
app.get("/getStationList", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing ?token parameter");

  const url =
    "https://eu-gateway.isolarcloud.com/openapi/pvm/station/v2/getStationList";
  const payload = {
    appkey: APPKEY,
    sys_code: "901",
    auth_user: AUTH_USER,
    curPage: 1,
    size: 10,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "bearer " + token, // 🔸 little 'b' variant
        "x-access-key": SECRETKEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    console.log("Svar från getStationList:", text);
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ===============================================================
// 🧩 5️⃣ Hämta KPI-data (PV, Load, Buy, Sell)
// ===============================================================
app.post("/getKpiDay", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing ?token parameter");

  const url =
    "https://eu-gateway.isolarcloud.com/openapi/pvm/station/v2/getKpiStationDay";

  const body = {
    ...req.body,
    appkey: APPKEY,
    sys_code: "901",
    auth_user: AUTH_USER,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "bearer " + token,
        "x-access-key": SECRETKEY,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    console.log("Svar från getKpiStationDay:", text);
    res.type("application/json").send(text);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ===============================================================
// 🧩 Starta servern
// ===============================================================
app.listen(3000, () => console.log("✅ Servern körs på port 3000 (EU-version)"));
