import * as admin from "firebase-admin";
import * as crypto from "crypto";

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "mock-client-email@mock.com";

  // Check if we have a real private key or a dummy placeholder
  const isDummy = !privateKey || 
                  privateKey.includes("your-private-key") || 
                  privateKey.includes("MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC");

  if (isDummy) {
    // Dynamically generate a mathematically valid 2048-bit RSA private key in PKCS#8 PEM format
    // to bypass OpenSSL certificate parsing checks during static Next.js compilation runs
    const { privateKey: generatedKey } = crypto.generateKeyPairSync("rsa" as any, {
      modulusLength: 2048,
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });
    privateKey = generatedKey as unknown as string;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
