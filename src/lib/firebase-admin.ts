import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or use admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

// Ensure API key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Gemini call as a reusable function
async function generatePost(topic: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const result = await model.generateContent(
    `Write a professional and engaging LinkedIn post on: ${topic}`
  );

  return result.response.text();
}

// API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { topic } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Invalid topic provided' });
  }

  try {
    const text = await generatePost(topic);

    await db.collection('linkedinPosts').add({
      topic,
      generatedPost: text,
      createdAt: new Date(),
    });

    res.status(200).json({ post: text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
