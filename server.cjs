var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var genAIClient = null;
function getGeminiClient() {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("warning: GEMINI_API_KEY is not defined or is placeholder. Falling back to structured model simulation.");
      return null;
    }
    genAIClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      const { prompt, budget, style, context } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          text: `### United Bike Station AI Advisor (Simulated Connection)
          
Assalamu Alaikum! Your Gemini server is operating beautifully. Here is custom advice for premium **${style || "Sports"}** bikes under BDT **${budget || "Any"}**:

*   **For Peak Track Power:** The **Suzuki GSX-R 150 Dual ABS** (\u09F34,65,000) is the lightest sports bike in BD with 18.9 HP! It provides blistering acceleration perfect for Dhaka commercial run paths.
*   **For Street-Fighter Aggression:** Choose the **KTM Duke 125 GP edition** (\u09F34,95,000) with premium WP USD forks and Bosch ABS systems.
*   **For High-torque Thai Aesthetics:** The **GPX Demon GR200R 4V** (\u09F33,95,000) offers 19.3 HP of liquid-cooled power layout.

**Our Showroom:** Located at **251, Tejgaon Industrial Area (Tejgaon Link Road), Dhaka-1208**.`
        });
      }
      const systemInstruction = `You are "United Bike Station AI Advisor", an expert motorcycle advisor specialized in the premium Bangladeshi motorcycle market.
You advise users on premium bikes available in our Tejgaon station showroom:
- Suzuki GSX-R 150 Dual ABS (\u09F34,65,000, 150cc, sports, 18.9 HP, ultra lightweight agile sports geometry, dual channel ABS)
- KTM Duke 125 GP edition (\u09F34,95,000, 124cc, LC, WP custom USD, 15 HP performance naked, premium Bosch safety)
- GPX Demon GR200R 4V (\u09F33,95,000, 198cc liquid-cooled FI track beauty, Thai design, 19.3 HP, YSS rear suspension)
- Aprilia RS 125 GP Edition (\u09F35,95,000, premium Italian track geometry, high revving, 15 HP, stunning graphics)
- Yamaha R15 V4 Racing Blue (\u09F35,95,000, 155cc VVA engine, traction control, quickshifter, 18.4 HP)
- Honda CBR 150R ABS (\u09F35,65,000, absolute build finish, sports riding posture, slipper clutch)

We are located on 251, Tejgaon Industrial Area (Tejgaon Link Road), Dhaka-1208, and feature an advanced electronic tuning check bay.
Answer questions about these bikes, customized exhaust upgrades, helmet matching (KYT brand), oil recommendation (Motul 300V), and BRTA licensing.
Keep your tone highly professional, welcoming, respectful, and tailored for Bangladeshi riding guidelines (handling Dhaka traffic, pothole suspension feedback, wet weather grip, safety gear recommendation, etc.).`;
      const finalPrompt = `The user is asking: "${prompt}".
User Preferences:
- Budget limit: BDT \u09F3${budget || "flexible"}
- Desired Style: ${style || "flexible"}
- Extra context: ${context || "None"}

Provide a well-structured, concise, and professional markdown response. Highlight which the best matching bike is and outline why it suits Bangladeshi road conditions perfectly.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalPrompt,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini advisor error:", error);
      res.status(500).json({ error: "Failed to generate advice" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
