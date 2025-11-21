// src/app/api/services/linkedin.js
import axios from "axios";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const db = getFirestore();
    const usersSnap = await db.collection("users").get();

    let successCount = 0;
    let errorCount = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      const token = user.linkedin_access_token;

      if (!token) {
        console.log(`Skipping user ${doc.id} - no LinkedIn token`);
        continue;
      }

      if (!user.post_content) {
        console.log(`Skipping user ${doc.id} - no post content`);
        continue;
      }

      try {
        await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
      {
        author: `urn:li:person:${user.linkedinId}`,  // or organization
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: user.content },
        shareMediaCategory: "NONE",
        },
      },
        visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
        Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
  },
    }
  );



        await db.collection("users").doc(doc.id).update({ 
          status: "posted",
          last_posted: admin.firestore.FieldValue.serverTimestamp()
        });
        
        successCount++;
        console.log(`Successfully posted for user ${doc.id}`);
      } catch (err) {
        errorCount++;
        console.error(`Error posting for user ${doc.id}:`, err.response?.data || err.message);
        
        await db.collection("users").doc(doc.id).update({ 
          status: "error",
          last_error: err.message,
          last_error_time: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    res.status(200).json({ 
      message: "Posts processed successfully",
      success: successCount,
      errors: errorCount
    });
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ 
      message: "Error processing posts", 
      error: err.message 
    });
  }
}