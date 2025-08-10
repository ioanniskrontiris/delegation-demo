import express from "express";
import morgan from "morgan";
import cors from "cors";
import { SignJWT, jwtVerify, generateKeyPair } from "jose";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

let keyPair: CryptoKeyPair;
(async () => { keyPair = await generateKeyPair("RS256"); })();

app.post("/assert", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "no user token" });

  const sessionId = `sess-${Date.now()}`;
  const jwt = await new SignJWT({ sub: "agent-123", sid: sessionId, scope: "echo:read" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer("gateway.example")
    .setAudience("tool-server")
    .setExpirationTime("2m")
    .sign(keyPair.privateKey);

  return res.json({ assertion: jwt, sid: sessionId });
});

async function verifyAssertion(token: string) {
  const { payload } = await jwtVerify(token, keyPair.publicKey, {
    issuer: "gateway.example",
    audience: "tool-server",
  });
  return payload;
}

app.get("/tool/echo", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "no assertion" });
  const token = auth.slice("Bearer ".length);

  try {
    const payload = await verifyAssertion(token);
    if (!String(payload.scope).includes("echo:read")) return res.status(403).json({ error: "forbidden" });

    const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const upstream = await fetch(`http://localhost:9090/echo${q}`);
    const data = (await upstream.json()) as Record<string, unknown>;

    return res.json({
      ...(data as object),
      sid: payload.sid,
      agent: payload.sub,
      auditedBy: "gateway"
    });
  } catch {
    return res.status(401).json({ error: "bad assertion" });
  }
});

app.listen(8080, () => console.log("Gateway listening on :8080"));