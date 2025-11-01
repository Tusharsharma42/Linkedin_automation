// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

// Gemini API setup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY not set');
const genAI = new GoogleGenerativeAI(apiKey);

// Gemini generation function
async function generatePost(topic: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(`Write a professional LinkedIn post about: ${topic}`);
  return result.response.text();
}

// API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Missing topic' });

  try {
    const post = await generatePost(topic);

    await db.collection('linkedinPosts').add({
      topic,
      generatedPost: post,
      createdAt: new Date(),
      source: 'gemini',
    });

    res.status(200).json({ success: true, text: post });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
