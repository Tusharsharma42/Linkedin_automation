'use strict';
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

exports.postLinkedinContent = functions.https.onRequest(async (req, res) => {
  const now = new Date();
  console.log("LinkedIn Auto Post Triggered:", now.toISOString());

  try {
    const snapshot = await db.collection("scheduledPosts").where("posted", "==", false).get();
    const postsToSend = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.scheduledTime) return;
      const scheduledTime = new Date(data.scheduledTime);
      if (scheduledTime <= now) postsToSend.push({ id: doc.id, ...data });
    });

    for (const post of postsToSend) {
      let authorUrn = "";
      if (post.companyPage) authorUrn = `urn:li:organization:${post.companyPage}`;
      else if (post.linkedInPersonId) authorUrn = `urn:li:person:${post.linkedInPersonId}`;
      else continue;

      try {
        const response = await axios.post(
          "https://api.linkedin.com/v2/ugcPosts",
          {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: post.content },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${post.linkedInAccessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
              "Content-Type": "application/json",
            },
          }
        );
        await db.collection("scheduledPosts").doc(post.id).update({
          posted: true,
          postedAt: admin.firestore.FieldValue.serverTimestamp(),
          linkedinResponse: response.data,
        });
      } catch (err) {
        await db.collection("scheduledPosts").doc(post.id).update({
          postFailed: true,
          failureReason: err.response?.data || err.message,
        });
      }
    }

    res.status(200).send("LinkedIn posting run complete.");
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Server error");
  }
});
