import axios from "axios";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

export default async function handler(req, res) {
  const db = getFirestore();

  const usersSnap = await db.collection("users").get();

  for (const doc of usersSnap.docs) {
    const user = doc.data();
    const token = user.linkedin_access_token;

    if (!token) continue;

    try {
      await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author: `urn:li:person:${user.linkedin_id}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: user.post_content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await db.collection("users").doc(doc.id).update({ status: "posted" });

    } catch (err) {
      console.error(`Error posting for user ${doc.id}:`, err.message);
    }
  }

  res.status(200).json({ message: "Posts processed successfully" });
}
