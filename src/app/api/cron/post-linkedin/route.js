import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function POST(req) {
  try {
    const db = getFirestore();
    const now = new Date().toISOString();

    // Query for scheduled posts that haven't been posted yet and are due
    // Note: For simplicity in this fix, we are checking all unposted items. 
    // In a production cron, you'd likely filter by scheduledTime <= now.
    const postsSnap = await db.collection('scheduledPosts')
      .where('posted', '==', false)
      .get();

    if (postsSnap.empty) {
      return NextResponse.json({ message: 'No pending posts found' }, { status: 200 });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const doc of postsSnap.docs) {
      const postData = doc.data();
      
      // Basic validation
      if (!postData.linkedInAccessToken || !postData.content || !postData.clientid) {
        console.log(`Skipping post ${doc.id} - missing required fields`);
        results.push({ id: doc.id, status: 'skipped', reason: 'Missing required fields' });
        continue;
      }

      // Check if it's time to post (if you want to enforce schedule strictly)
      if (postData.scheduledTime && postData.scheduledTime > now) {
         console.log(`Skipping post ${doc.id} - scheduled for future: ${postData.scheduledTime}`);
         continue;
      }

      try {
        // Construct the URN
        // Assuming clientid is the ID. If it's a company page, it might need "organization:" prefix.
        // If it's a person, it needs "person:" prefix.
        // The previous code used "organization:", but let's try to be smarter or default to what was there if unsure.
        // However, the safest bet for a generic "clientid" which is usually a member ID is "person".
        // BUT, the user's previous code had `urn:li:organization:${user.clientid}`.
        // Let's check if there is a hint. The frontend has `companyPage` field.
        // If `companyPage` is populated, it might be an organization.
        
        let authorUrn = `urn:li:person:${postData.clientid}`;
        if (postData.companyPage) {
             // If companyPage looks like an ID (digits), use it. 
             // If it's a URL, we might need to extract ID, but let's assume the user put the ID in clientid 
             // and maybe intended it to be an organization if companyPage is set?
             // Let's stick to the user's previous pattern if possible, OR try to detect.
             // Actually, the safest way with the new API is to use the `author` field correctly.
             
             // If the previous code forced "organization", maybe they are only posting to company pages?
             // Let's look at the previous code again: `author: 'urn:li:organization:${user.clientid}'`
             // If the user is posting to a personal profile, it MUST be `urn:li:person:...`.
             // I will assume `person` by default as it's more common for "clientid", 
             // unless I see strong evidence otherwise. 
             // Wait, the frontend saves `clientid`. 
             // Let's try to support both or default to person.
             // A common issue is using the wrong URN type.
             
             // Let's try to determine based on the ID format if possible, or just try one.
             // For now, I will use `urn:li:person:${postData.clientid}` as it is the standard for personal profiles.
             // If the user specifically wants company pages, they usually provide an organization ID.
             
             // RE-READING OLD CODE: `author: urn:li:organization:${user.clientid}`
             // This suggests the user WAS trying to post to an organization.
             // I will add a check: if `postData.companyPage` is present, I'll assume organization.
             // Else person.
        }
        
        // However, the `clientid` field name is ambiguous. 
        // Let's look at the frontend `src/app/services/page.js`:
        // `clientid: linkedinDetails.clientid`
        // And the input placeholder says "https://linkedin.com/in/yourprofile" for clientid? No, that's for profileUrl.
        // `clientid` input has placeholder "https://linkedin.com/in/yourprofile" (copy-paste error in frontend code likely).
        
        // I will use a heuristic:
        // If `postData.companyPage` is truthy, use `urn:li:organization:${postData.clientid}` (assuming clientid IS the org id).
        // Else use `urn:li:person:${postData.clientid}`.
        
        if (postData.companyPage) {
             authorUrn = `urn:li:organization:${postData.clientid}`;
        }

        const postBody = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postData.content
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        // Note: The /v2/posts API is the newer one, but /v2/ugcPosts is what was used.
        // /v2/posts is for the "Posts API" (text, images, videos, etc).
        // /v2/ugcPosts is the "UGC Posts API".
        // LinkedIn recommends moving to the Posts API, but ugcPosts is still widely used.
        // The implementation plan said "The LinkedIn API endpoint will be updated to https://api.linkedin.com/v2/posts".
        // So I should use the schema for /v2/posts.
        
        // Schema for /rest/posts (or /v2/posts which is the same underlying resource usually):
        /*
        {
            "author": "urn:li:organization:1234",
            "commentary": "Hello World",
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": false
        }
        */
       
        // Let's use the NEW /v2/posts schema.
        const newPostBody = {
            author: authorUrn,
            commentary: postData.content,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
        };

        await axios.post(
          'https://api.linkedin.com/rest/posts', // Using the /rest/ version which is the current standard for the Posts API
          newPostBody,
          {
            headers: {
              'Authorization': `Bearer ${postData.linkedInAccessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type': 'application/json',
              'LinkedIn-Version': '202304' // It's good practice to specify a version, but maybe optional. 
                                           // X-Restli-Protocol-Version is critical.
            }
          }
        );

        // Update Firestore
        await db.collection('scheduledPosts').doc(doc.id).update({
          posted: true,
          postedAt: new Date().toISOString(),
          status: 'success'
        });

        successCount++;
        results.push({ id: doc.id, status: 'success' });
        console.log(`Successfully posted for ${doc.id}`);

      } catch (err) {
        errorCount++;
        console.error(`Error posting for ${doc.id}:`, err.response?.data || err.message);
        
        await db.collection('scheduledPosts').doc(doc.id).update({
          status: 'error',
          lastError: JSON.stringify(err.response?.data || err.message),
          lastErrorTime: new Date().toISOString()
        });
        
        results.push({ id: doc.id, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      message: 'Batch processing complete',
      successCount,
      errorCount,
      results
    }, { status: 200 });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
