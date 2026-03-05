/**
 * One-time script to write admin profile to Firestore via REST API.
 * The auth user was already created. This writes directly using the API.
 * Run: node setup-admin.mjs
 * Delete this file after use.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyD4bDkUVKQcHxscU0KIKRgZfElJEAOSrzI',
    authDomain: 'kimbalert-africa.firebaseapp.com',
    projectId: 'kimbalert-africa',
    storageBucket: 'kimbalert-africa.firebasestorage.app',
    messagingSenderId: '104705881525',
    appId: '1:104705881525:web:0b0601bf946ccd204e55fc',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const EMAIL = 'admin.kimbalert@gmail.com';
const PASSWORD = 'Kimbalert123';
const PROJECT_ID = 'kimbalert-africa';

async function main() {
    // Sign in to get the auth token
    console.log('Signing in...');
    const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const uid = cred.user.uid;
    const token = await cred.user.getIdToken();
    console.log('✅ Signed in. UID:', uid);

    // Write admin doc via Firestore REST API
    const adminProfile = {
        fields: {
            id: { stringValue: uid },
            role: { stringValue: 'admin' },
            tier: { stringValue: 'super' },
            fullName: { stringValue: 'KimbAlert Admin' },
            email: { stringValue: EMAIL },
            phone: { stringValue: '' },
            joinedAt: { stringValue: new Date().toISOString() },
        },
    };

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}?updateMask.fieldPaths=id&updateMask.fieldPaths=role&updateMask.fieldPaths=tier&updateMask.fieldPaths=fullName&updateMask.fieldPaths=email&updateMask.fieldPaths=phone&updateMask.fieldPaths=joinedAt`;

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminProfile),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('❌ Firestore write failed:', res.status, err);
        console.log('');
        console.log('You need to update Firestore rules to allow admin creation.');
        console.log('Go to Firebase Console → Firestore → Rules, and temporarily set:');
        console.log('');
        console.log('  rules_version = \'2\';');
        console.log('  service cloud.firestore {');
        console.log('    match /databases/{database}/documents {');
        console.log('      match /{document=**} {');
        console.log('        allow read, write: if request.auth != null;');
        console.log('      }');
        console.log('    }');
        console.log('  }');
        console.log('');
        console.log('Then run this script again. Remember to tighten rules after!');
        process.exit(1);
    }

    console.log('✅ Admin profile written to Firestore!');
    console.log('');
    console.log('🎉 Done! You can now log in with:');
    console.log('   Email:    admin.kimbalert@gmail.com');
    console.log('   Password: Kimbalert123');
    console.log('');
    console.log('   Tap the logo 5 times on the login page to reveal Command Center.');
    console.log('');
    console.log('⚠️  Delete this file (setup-admin.mjs) when done.');

    process.exit(0);
}

main().catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
