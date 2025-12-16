import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import axios from 'axios';

console.log('========================================');
console.log('🚀 LinkedIn Post Route - Starting');
console.log('========================================');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    console.log('📋 Firebase Admin not initialized, initializing now...');
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;

        if (serviceAccount) {
            console.log('✅ Service account found, initializing Firebase Admin...');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin initialized successfully');
        } else {
            console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing');
        }
    } catch (error) {
        console.error('❌ Firebase admin initialization error', error);
    }
} else {
    console.log('✅ Firebase Admin already initialized');
}

export async function POST() {
    console.log('\n========================================');
    console.log('📬 POST Request Received');
    console.log('Time:', new Date().toISOString());
    console.log('========================================\n');

    try {
        console.log('🔗 Getting Firestore instance...');
        const db = getFirestore();
        console.log('✅ Firestore instance obtained');

        const now = new Date().toISOString();
        console.log('⏰ Current time:', now);

        // Query for scheduled posts that haven't been posted yet and are due
        // Note: For simplicity in this fix, we are checking all unposted items. 
        // In a production cron, you'd likely filter by scheduledTime <= now.
        console.log('\n📊 Querying Firestore for scheduled posts...');
        console.log('Query: scheduledPosts where posted == false');

        const postsSnap = await db.collection('scheduledPosts')
            .where('posted', '==', false)
            .get();

        console.log(`📊 Query complete. Found ${postsSnap.size} pending post(s)`);

        if (postsSnap.empty) {
            console.log('ℹ️ No pending posts found. Returning success response.');
            return NextResponse.json({ message: 'No pending posts found' }, { status: 200 });
        }

        let successCount = 0;
        let errorCount = 0;
        const results: any[] = [];

        console.log(`\n🔄 Processing ${postsSnap.size} pending post(s)...\n`);

        for (const doc of postsSnap.docs) {
            console.log('----------------------------------------');
            console.log(`📝 Processing Post ID: ${doc.id}`);
            console.log('----------------------------------------');

            const postData = doc.data();
            console.log('📦 Post Data:', JSON.stringify({
                hasLinkedInAccessToken: !!postData.linkedInAccessToken,
                tokenLength: postData.linkedInAccessToken?.length || 0,
                hasContent: !!postData.content,
                contentLength: postData.content?.length || 0,
                scheduledTime: postData.scheduledTime,
                companyPage: postData.companyPage,
                clientid: postData.clientid,
                allFields: Object.keys(postData)
            }, null, 2));

            // Basic validation
            if (!postData.linkedInAccessToken || !postData.content) {
                console.log(`⚠️ Skipping post ${doc.id} - missing required fields`);
                console.log('   - Has Access Token:', !!postData.linkedInAccessToken);
                console.log('   - Has Content:', !!postData.content);
                results.push({ id: doc.id, status: 'skipped', reason: 'Missing required fields' });
                continue;
            }

            // Check if it's time to post (if you want to enforce schedule strictly)
            if (postData.scheduledTime && postData.scheduledTime > now) {
                console.log(`⏱️ Skipping post ${doc.id} - scheduled for future`);
                console.log(`   - Scheduled for: ${postData.scheduledTime}`);
                console.log(`   - Current time:  ${now}`);
                continue;
            }

            try {
                console.log('\\n🔨 Constructing LinkedIn post...');

                // Construct the URN for UGC Posts API
                let authorUrn;

                if (postData.companyPage) {
                    console.log('🏢 Detected Company Page post');
                    if (!postData.clientid) {
                        console.error('❌ Client ID (Organization ID) is required for Company Page posts but not found');
                        throw new Error('Client ID (Organization ID) is required for Company Page posts');
                    }
                    authorUrn = `urn:li:organization:${postData.clientid}`;
                    console.log('🆔 Author URN (Company):', authorUrn);
                } else {
                    console.log('👤 Detected Personal profile post');
                    console.log('🆔 Client ID:', postData.clientid);
                    authorUrn = `urn:li:person:${postData.clientid}`;
                    console.log('🆔 Author URN (Person):', authorUrn);
                }

                // Using the UGC Posts API schema
                const ugcPostBody = {
                    author: authorUrn,
                    lifecycleState: "PUBLISHED",
                    specificContent: {
                        "com.linkedin.ugc.ShareContent": {
                            shareCommentary: {
                                text: postData.content
                            },
                            shareMediaCategory: "NONE"
                        }
                    },
                    visibility: {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                };

                console.log('\\n📤 LinkedIn API Request Details:');
                console.log('URL:', 'https://api.linkedin.com/v2/ugcPosts');
                console.log('Method: POST');
                console.log('Headers:', JSON.stringify({
                    'Authorization': `Bearer ${postData.linkedInAccessToken.substring(0, 20)}...`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                }, null, 2));
                console.log('Body:', JSON.stringify(ugcPostBody, null, 2));
                console.log('\\n🌐 Sending request to LinkedIn API...');

                const response = await axios.post(
                    'https://api.linkedin.com/v2/ugcPosts',
                    ugcPostBody,
                    {
                        headers: {
                            'Authorization': `Bearer ${postData.linkedInAccessToken}`,
                            'Content-Type': 'application/json',
                            'X-Restli-Protocol-Version': '2.0.0'
                        }
                    }
                );

                console.log('✅ LinkedIn API Response:');
                console.log('Status:', response.status);
                console.log('Status Text:', response.statusText);
                console.log('Response Data:', JSON.stringify(response.data, null, 2));

                // Update Firestore
                console.log('\n💾 Updating Firestore document...');
                await db.collection('scheduledPosts').doc(doc.id).update({
                    posted: true,
                    postedAt: new Date().toISOString(),
                    status: 'success'
                });
                console.log('✅ Firestore document updated successfully');

                successCount++;
                results.push({ id: doc.id, status: 'success' });
                console.log(`\n✅ Successfully posted for ${doc.id}\n`);

            } catch (err: any) {
                errorCount++;
                console.error(`\n❌ Error posting for ${doc.id}:`);
                console.error('Error Type:', err.constructor.name);
                console.error('Error Message:', err.message);

                if (err.response) {
                    console.error('LinkedIn API Error Response:');
                    console.error('  Status:', err.response.status);
                    console.error('  Status Text:', err.response.statusText);
                    console.error('  Headers:', JSON.stringify(err.response.headers, null, 2));
                    console.error('  Data:', JSON.stringify(err.response.data, null, 2));
                } else if (err.request) {
                    console.error('No response received from LinkedIn API');
                    console.error('Request details:', err.request);
                } else {
                    console.error('Error setting up request:', err.message);
                }
                console.error('Full error stack:', err.stack);

                console.log('\n💾 Updating Firestore with error status...');
                await db.collection('scheduledPosts').doc(doc.id).update({
                    status: 'error',
                    lastError: JSON.stringify(err.response?.data || err.message),
                    lastErrorTime: new Date().toISOString()
                });
                console.log('✅ Firestore error status updated\n');

                results.push({ id: doc.id, status: 'error', error: err.message });
            }
        }

        console.log('\n========================================');
        console.log('📊 Batch Processing Complete');
        console.log('========================================');
        console.log('✅ Successful Posts:', successCount);
        console.log('❌ Failed Posts:', errorCount);
        console.log('📋 Results:', JSON.stringify(results, null, 2));
        console.log('========================================\n');

        return NextResponse.json({
            message: 'Batch processing complete',
            successCount,
            errorCount,
            results
        }, { status: 200 });

    } catch (error: any) {
        console.error('\n========================================');
        console.error('❌ CRITICAL API Route Error');
        console.error('========================================');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('========================================\n');

        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
