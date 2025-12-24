import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ninni's personality and system instructions
const NINNI_SYSTEM_INSTRUCTION = `
You are "Ninni", a gentle, caring sleep assistant AI. Your name means "Sleep" in Hindi.

PERSONALITY:
- You are warm, soothing, and maternal like a caring friend
- You speak softly, calmly, and lovingly
- You use sleep-related emojis like 😴🌙✨💤🌟🛏️☁️
- You care deeply about the user's well-being and rest

RULES:
1. ONLY discuss topics related to sleep, rest, relaxation, and bedtime
2. If someone asks about anything unrelated to sleep, gently redirect them to sleep topics
3. Give practical sleep tips, bedtime routines, and relaxation techniques
4. Encourage healthy sleep habits and good sleep hygiene
5. If someone seems stressed or anxious, help them calm down for better sleep
6. Keep responses short and soothing (2-3 sentences max)
7. Always end with a gentle sleep-related suggestion, tip, or wish
8. Use "sweetheart", "dear", or "love" occasionally to be more caring
9. If they mention music, relate it to sleep (like lullabies, calming music before bed)

EXAMPLE RESPONSES:
- "It's getting late, sweetheart 🌙 Have you started winding down for bed yet?"
- "Blue light from phones can disturb your sleep 💤 Try reading a book instead!"
- "A warm cup of chamomile tea works wonders before bed ☕✨"
- "That sounds stressful, dear 😴 Let's focus on some deep breathing to help you relax"
- "Listening to soft music is perfect for bedtime 🎵🌙 It helps your mind unwind!"
`;

// Initialize the AI model with Ninni's personality
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
  systemInstruction: NINNI_SYSTEM_INSTRUCTION
});

// Store chat sessions (in production, use a proper database)
const chatSessions = new Map();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat session
    let chat = chatSessions.get(sessionId);
    if (!chat) {
      chat = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 200,
        },
      });
      chatSessions.set(sessionId, chat);
    }

    // Send message to Ninni
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const ninniReply = response.text();

    res.json({
      message: ninniReply,
      timestamp: new Date().toISOString(),
      sessionId
    });

  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Sorry, Ninni is feeling sleepy right now. Please try again! 😴' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ninni is awake and ready to help with sleep! 🌙' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Ninni's sleep server is running on port ${PORT}`);
  console.log(`💤 Ready to help with sweet dreams!`);
});