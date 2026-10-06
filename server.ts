import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint for Google Search grounded queries (orbital debris reports, real-time launch schedules)
app.post('/api/grounding/search', async (req, res) => {
  try {
    const { query, category } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    let searchPrompt = query;
    if (category === 'DEBRIS') {
      searchPrompt = `Provide the latest up-to-date orbital space debris report, trackings, collision warnings, or recent fragmentation events: ${query}`;
    } else if (category === 'LAUNCHES') {
      searchPrompt = `Provide the latest verified space launch schedule, upcoming orbital launches, rocket types, launch sites, and dates: ${query}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'No report found.';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks
      .map((c: any) => ({
        title: c.web?.title || 'Grounding Reference',
        uri: c.web?.uri || '',
      }))
      .filter((s: any) => s.uri);

    res.json({
      query,
      category,
      text,
      sources,
      timestampUtc: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch grounded orbital report',
    });
  }
});

// API endpoint for Google Maps Grounding (Ground Stations, Launch Complexes, Spaceports)
// Uses gemini-3.5-flash with googleMaps tool as strictly instructed
app.post('/api/gemini/maps-grounding', async (req, res) => {
  try {
    const { prompt, latitude, longitude } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const text = response.text || 'No facility details found.';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract Google Maps URLs and place snippets
    const mapPlaces: any[] = [];
    for (const chunk of rawChunks) {
      if (chunk.maps) {
        mapPlaces.push({
          title: chunk.maps.title || 'Space Facility',
          uri: chunk.maps.uri || '',
          reviewSnippets: chunk.maps.placeAnswerSources?.reviewSnippets || [],
        });
      }
    }

    res.json({
      prompt,
      text,
      mapPlaces,
      timestampUtc: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    res.status(500).json({
      error: error.message || 'Failed to execute Google Maps grounding query',
    });
  }
});

// API endpoint for Multi-Turn Chatbot using Gemini
// Supports gemini-3.1-pro-preview (complex tasks), gemini-3.5-flash (general tasks), gemini-3.1-flash-lite (fast tasks)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, modelTier } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Model selection based on user brief:
    // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general, gemini-3.1-flash-lite for fast tasks
    let selectedModel = 'gemini-3.5-flash';
    if (modelTier === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (modelTier === 'complex') {
      selectedModel = 'gemini-3.1-pro-preview';
    }

    // Format multi-turn conversation history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Mission Control Flight Dynamics Officer (FDO) and Senior Astrodynamics Specialist for the Physics-Accurate Orbital Mission Planner.',
        },
      });
    } catch (modelErr: any) {
      // Graceful fallback to gemini-3.8-flash if paid model tier requires paid key
      if (selectedModel === 'gemini-3.1-pro-preview') {
        console.warn('Falling back from gemini-3.1-pro-preview to gemini-3.8-flash:', modelErr.message);
        selectedModel = 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction: systemInstruction || 'You are Mission Control Flight Dynamics Officer.',
          },
        });
      } else {
        throw modelErr;
      }
    }

    const replyText = response.text || '';

    res.json({
      text: replyText,
      modelUsed: selectedModel,
      timestampUtc: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Chat generation failed',
    });
  }
});

// API endpoint for Real-Time Voice Audio Conversations (CAPCOM Audio Uplink)
// Returns voice synthesis for real-time auditory interaction with Mission Control
app.post('/api/gemini/voice-conversation', async (req, res) => {
  try {
    const { transcript, voiceName = 'Kore' } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // 1. Generate Flight Controller response
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: transcript,
      config: {
        systemInstruction:
          'You are Houston CAPCOM (Capsule Communicator) speaking over real-time mission audio comms. Keep responses concise, direct, professional, and aerospace-authentic (1-3 sentences max).',
      },
    });

    const replyText = textResponse.text || 'Copy that, flight telemetry nominal.';

    // 2. Synthesize audio with gemini-3.8-flash-lite-tts
    let audioBase64 = null;
    try {
      const audioResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: replyText,
                speechMetadata: {
                  style: 'Calm, authoritative space flight controller over radio uplink',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (audioErr: any) {
      console.warn('TTS generation notice:', audioErr.message);
    }

    res.json({
      replyText,
      audioBase64,
      timestampUtc: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Voice conversation error:', error);
    res.status(500).json({
      error: error.message || 'Failed voice conversation',
    });
  }
});

// Setup Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
