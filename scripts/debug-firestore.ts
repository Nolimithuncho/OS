import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runDiagnostics() {
  console.log("=== Firestore Diagnostics ===");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);

  try {
    const adminUsersColl = collection(db, 'admin_users');
    const adminUsersSnap = await getDocs(adminUsersColl);
    console.log(`\n--- Admin Users (${adminUsersSnap.size}) ---`);
    adminUsersSnap.docs.forEach(doc => {
      console.log(`- Document: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Failed to read admin_users:", err);
  }

  try {
    const adminsColl = collection(db, 'admins');
    const adminsSnap = await getDocs(adminsColl);
    console.log(`\n--- Admins Directory (${adminsSnap.size}) ---`);
    adminsSnap.docs.forEach(doc => {
      console.log(`- Document: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Failed to read admins:", err);
  }

  try {
    const mentorshipColl = collection(db, 'mentorship');
    const mentorshipSnap = await getDocs(mentorshipColl);
    console.log(`\n--- Mentorship Apps (${mentorshipSnap.size}) ---`);
    mentorshipSnap.docs.forEach(doc => {
      console.log(`- Document: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Failed to read mentorship:", err);
  }
}

runDiagnostics();
