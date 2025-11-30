import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            console.error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export async function POST() {
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
        const results: any[] = [];

        for (const doc of postsSnap.docs) {
            const postData = doc.data();

            // Basic validation
            if (!postData.linkedInAccessToken || !postData.content) {
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

                let authorUrn;

                if (postData.companyPage) {
                    // For Company Pages, we still need the Organization ID (stored in clientid)
                    if (!postData.clientid) {
                        throw new Error('Client ID (Organization ID) is required for Company Page posts');
                    }
                    authorUrn = `urn:li:organization:${postData.clientid}`;
                } else {
                    authorUrn = `urn:li:person:${postData.clientid}`;
                }

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

            } catch (err: any) {
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

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
