# Firebase Security Specification (TDD SPEC)

## 1. Data Invariants
- **Admins** have full access to edit static sections, publish content, modify subscriber files, review and approve fellowship applications, and delete comments. 
- **Subscribers** can read public essays, media details, registers, and write comments. They can also register their own subscriber profiles and submit fellowship applications.
- **Verification Rule**: All write operations require a verified email (`request.auth.token.email_verified == true`).
- **Owner Isolation**: Users can only read/edit private collections (like private profiles or their own mentorship applications) mapped to their secure authentication UID.

## 2. The "Dirty Dozen" Malicious Payloads

1. **Self-Appointed Administrator**: Authenticated user attempts to write to `/sections/about` with a payload bypassing ownership.
2. **Ghost Field Mutation**: Writing a content item with unapproved fields (e.g., `isVerified: true`).
3. **ID Poisoning Attack**: Passing a 1.5KB string as a Firestore document ID to cause a resource exhaustion attack.
4. **Email Spoofing Attack**: Authenticated user with email `admin@chancellery.org` but `email_verified = false` attempting to delete feedback.
5. **PII Blanket Query Leak**: Attempting to grab list details of other subscriber email maps without standard limits.
6. **Relational Sync Break**: Creating a sub-resource or comments with a non-existent or spoofed essay ID mapping.
7. **Temporal Violation (Future creation)**: Writing a comment with `createdAt` parameter pointing to tomorrow instead of standard `request.time`.
8. **Immutability Breach**: Updating historical content blocks to alter their original `createdAt` or `userId`.
9. **Role Escalation**: Standard subscriber updating their profile array to inject `"role": "admin"`.
10. **State Shortcutting**: Mutating a mentorship application's admission status directly from `PENDING ADMISSION REVIEW` to `APPROVED` using standard subscriber privileges.
11. **Anomalous Large payload**: Invariant block exceeding maximum limits (e.g. 10MB string description in posts).
12. **Anonymous Spillover**: Accessing subscriber-exclusive write hooks with an anonymous token lacking validated email credentials.

## 3. Test Cases (TDD Reference Block)
Each of the payloads described above will return `PERMISSION_DENIED` thanks to our Zero-Trust Attribute-Based Access Control schema.
