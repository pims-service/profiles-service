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
    // Using a static valid 2048-bit RSA private key to bypass OpenSSL certificate
    // parsing checks instantly without heavy CPU blocks during development hot-reloads!
    privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCmUcq4Bq7nSsyL
5VvyO4EyAmgj2DyHlEY5uXGPx7XBIIdeQaJhYPZ5pQwZdOmkgSv6B6L2ouHxEo/s
Sh7t/sDLgMXndU9OUNWJP/m8fHnNS5ZGn1cEiRTQiMJvrx9TofQ2plk4ZiNW5yZh
CG2mWKgHruSEhUkvXFj6eBEHWuucNOfstMYbd9caY4fjcIl/foOZtgaxan2629Ec
L6324/8ZGVt7vU20162c4f4gdQlLMTj3z/OBOkTssXdxoaiYuAKLVKLYcb9m7ZtF
iQ2jqGv1Tkg+n0NrmT5xVd4PvaoNbHhAkzWCQ41G2DIiFMMEYo5yzRonpzHz8TaB
GEUBqvJBAgMBAAECggEAA2bcU8mf7xr3AhI8QGQF6XaUxoejzsG95w9xIdH+tZuI
cgCkCD5nMf8HCMgUNX2dyAQMhBH/5flkxAbvt4+76Nw1UvTmHP7HLGuUHFnU4KtC
1+DyRGs1XA13UESSbS/CX8wk3WP+gq9YMkAQhJ+tmCb/4nZgiI7RcUSYsO6jxt5i
bHDAnC38t0JwiFkOo1T5ZCqGow0wUPq/j7CBpvN6NymEz418bOcXIyecaYAL0j39
pz/DfhGrs6kIpCEKvkKHODSEdmwOHYb/gkA/oBbBX5N/0XHn8h/C79aXliVozVd6
bFZ413AJp8V39OtyVEzcrVmQN7URJRcb2EKUwknkHQKBgQDcFQWjBoLBKL8TEIwT
WY5IyS3eygXoecmLxnz8sSEpBPTzNSHJAX9w7QDbWE2V1LunFsZCOxlQs8m3+611
ObuBwStZJK6LOvir3tJlO8qSuraewbIJz1YBOQtKbflFGK8X4QlFJpE50yj7emPk
cqG2S1NmxWWhwxlt2RNetBhhWwKBgQDBdpSiHSjcezSDJzXWy+wHagaxEtA5uavs
f17tCAPb8kSZ7y+nULNTrendYf8XxaFb49uPNRDMl2viGej1Dc1/+PeF31iRrOYR
CRw2nxLsEpSVShv1N2ljhu0Wx+3hsjUzVkmhlmcP5het7Q+m8DeWDVE54t7EnF5H
5mxJHdwRkwKBgH3Xv2tis62DgQ6DrbT6xnM0Jfh4iDxQN0CndJyBJDbyUKYowXLQ
WnDV9GF38pU0GUEHssH4TRdqVnPPg3W+V0twizrj0LJoO/z64k9kiwavoPDSTN1z
Ivh8B8q9a4VpAeWjlctmrC/mYE67wxbDvVghZkUjpmOCza2ULJFAZZh1AoGAS+Ce
Wxbkt9T6u5XdX+mLIT1McpbWZE2WSKOML5s9KD7U+Sr+nbjhHKjRWKreygwRRWEQ
9BH0DMo23e8bl0FaoB6dtjvrGPefJH9WOXYajcybyhHO9VZOV2LMCmtPuX2TsBbf
uiirM2kjUGvx/5+nrYp7mSCKDsLll32gauzzK1ECgYEAtDSvUcCSmyK+UlUms4kD
QCe3TZComSKkZNpNpVTDQ3gePOwZIGFhUKc1sIDBlV3hH4P6k6gV0DWZh0zMRprp
OVRTw5tf1VUTftnDPNkku+Zn6UkEaiQgJe/+c+FrP1YBAQf5ZLiQ4kQpUo0E4VK/
TW0FiJv4sHQqVMyKUfXf63U=
-----END PRIVATE KEY-----`;
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
