
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityAlert, NetworkPacket } from "../types";

export const analyzeThreatWithGemini = async (
  alerts: SecurityAlert[],
  recentPackets: NetworkPacket[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze these security alerts and network traffic samples.
    Alerts: ${JSON.stringify(alerts.slice(0, 5))}
    Sample Packets: ${JSON.stringify(recentPackets.slice(0, 10))}
    
    Identify the likely attack vectors (e.g., Port Scan, DDoS, Lateral Movement).
    Provide a professional assessment and specific technical mitigation steps.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a senior SOC analyst and cybersecurity expert. Provide concise, high-impact security insights in JSON format.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assessment: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          threatLevel: { type: Type.NUMBER, description: "Scale 1-10" }
        },
        required: ["assessment", "recommendations", "threatLevel"]
      }
    },
  });

  return JSON.parse(response.text || "{}");
};
