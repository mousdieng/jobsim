# 📦 Storage Setup Guide

Complete guide to setting up Supabase Storage for JobSim Senegal.

---

## 📋 Overview

JobSim uses 4 storage buckets for different file types:

| Bucket | Public | Size Limit | Purpose |
|--------|--------|------------|---------|
| `submission-files` | ❌ Private | 50MB | Candidate submission files |
| `task-attachments` | ✅ Public | 10MB | Task descriptions and materials |
| `avatars` | ✅ Public | 2MB | User profile pictures |
| `company-logos` | ✅ Public | 2MB | Enterprise company logos |

---

## 🚀 Quick Setup (Recommended)

### Step 1: Create Buckets

Run the setup script in your Supabase SQL Editor:

```bash
# Navigate to project directory
cd C:\Users\Moussa Dieng\Desktop\Dev\jobsim

# Copy the SQL content
database/setup-storage.sql
```

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Create a new query
3. Paste the contents of `database/setup-storage.sql`
4. Click **Run**

This will:
- ✅ Create all 4 buckets
- ✅ Set size limits
- ✅ Configure allowed MIME types
- ✅ Verify creation

### Step 2: Apply Storage Policies

Run the policies script:

```bash
# In Supabase SQL Editor
database/migrations/006_storage_policies.sql
```

This will:
- ✅ Set up Row Level Security (RLS) policies
- ✅ Configure candidate upload permissions
- ✅ Configure reviewer access
- ✅ Configure admin permissions

---

## 🔧 Manual Setup (Alternative)

If you prefer to create buckets manually:

### 1. submission-files (Private)

**Supabase Dashboard → Storage → New Bucket:**
- **Name:** `submission-files`
- **Public:** ❌ No
- **File size limit:** 50 MB
- **Allowed MIME types:**
  ```
  application/pdf
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  application/vnd.ms-excel
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  application/vnd.ms-powerpoint
  application/vnd.openxmlformats-officedocument.presentationml.presentation
  text/plain
  image/jpeg
  image/png
  image/gif
  application/zip
  application/x-rar-compressed
  ```

### 2. task-attachments (Public)

- **Name:** `task-attachments`
- **Public:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:**
  ```
  application/pdf
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  text/plain
  image/jpeg
  image/png
  image/gif
  ```

### 3. avatars (Public)

- **Name:** `avatars`
- **Public:** ✅ Yes
- **File size limit:** 2 MB
- **Allowed MIME types:**
  ```
  image/jpeg
  image/png
  image/gif
  image/webp
  ```

### 4. company-logos (Public)

- **Name:** `company-logos`
- **Public:** ✅ Yes
- **File size limit:** 2 MB
- **Allowed MIME types:**
  ```
  image/jpeg
  image/png
  image/gif
  image/webp
  image/svg+xml
  ```

---

## ✅ Verification

### Check Buckets Created

Run this SQL query:

```sql
SELECT
  id,
  name,
  public,
  file_size_limit / 1048576 as size_limit_mb,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets
WHERE id IN ('submission-files', 'task-attachments', 'avatars', 'company-logos')
ORDER BY id;
```

**Expected Result:**
```
id                 | name              | public | size_limit_mb | mime_types_count | created_at
-------------------|-------------------|--------|---------------|------------------|--------------------
avatars            | avatars           | true   | 2             | 4                | 2026-01-14 ...
company-logos      | company-logos     | true   | 2             | 5                | 2026-01-14 ...
submission-files   | submission-files  | false  | 50            | 13               | 2026-01-14 ...
task-attachments   | task-attachments  | true   | 10            | 7                | 2026-01-14 ...
```

### Check Policies Created

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;
```

**Expected Result:** ~15-20 policies covering all buckets

---

## 🔐 Security Overview

### submission-files (Private)

**Who can upload:**
- ✅ Candidates (to their own folders only)

**Who can read:**
- ✅ Candidates (their own files only)
- ✅ Assigned reviewers (submissions they're reviewing)
- ✅ Enterprise reps (approved submissions only)
- ✅ Admins and platform support (all files)

**Folder structure:**
```
submission-files/
└── submissions/
    └── {candidate_id}/
        └── {submission_id}/
            ├── document.pdf
            ├── screenshot.png
            └── ...
```

### task-attachments (Public)

**Who can upload:**
- ✅ Admins only

**Who can read:**
- ✅ All authenticated users

**Who can delete:**
- ✅ Admins only

**Folder structure:**
```
task-attachments/
└── {task_id}/
    ├── description.pdf
    ├── requirements.docx
    └── ...
```

### avatars (Public)

**Who can upload:**
- ✅ All users (to their own folder only)

**Who can read:**
- ✅ Everyone (public)

**Who can update/delete:**
- ✅ Users (their own avatar only)

**Folder structure:**
```
avatars/
└── {user_id}/
    └── avatar.jpg
```

### company-logos (Public)

**Who can upload:**
- ✅ Enterprise reps (their company logo only)
- ✅ Admins (any company)

**Who can read:**
- ✅ Everyone (public)

**Who can update:**
- ✅ Enterprise reps (their company only)
- ✅ Admins (any company)

**Folder structure:**
```
company-logos/
└── {company_id}/
    └── logo.png
```

---

## 🧪 Testing Upload/Download

### Test Candidate Submission Upload

```typescript
// In your Angular app or console
import { StorageService } from './core/services/storage.service';

// Assuming you're logged in as a candidate
const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const files = [file];

storageService.uploadSubmissionFiles('submission-123', 'candidate-user-id', files)
  .subscribe(result => {
    if (result.data) {
      console.log('✅ Upload successful:', result.data);
    } else {
      console.error('❌ Upload failed:', result.error);
    }
  });
```

### Test Avatar Upload

```typescript
const avatarFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });

storageService.uploadAvatar(avatarFile).subscribe(result => {
  if (result.data) {
    console.log('✅ Avatar uploaded:', result.data);
  }
});
```

### Test Download URL

```typescript
const url = storageService.getPublicUrl('avatars', 'user-id-123/avatar.jpg');
console.log('Avatar URL:', url);
```

---

## 🐛 Troubleshooting

### Issue: "Bucket not found"

**Solution:** Run `setup-storage.sql` to create buckets

### Issue: "Permission denied"

**Solution:** Run `006_storage_policies.sql` to set up policies

### Issue: "File size limit exceeded"

**Check limits:**
- submission-files: 50MB
- task-attachments: 10MB
- avatars: 2MB
- company-logos: 2MB

### Issue: "Invalid MIME type"

**Check allowed types** for each bucket in `setup-storage.sql`

### Issue: "Policy violation"

**Common causes:**
1. User not authenticated
2. User trying to access another user's private files
3. Non-admin trying to upload task attachments
4. Wrong folder structure (e.g., not including user ID in path)

---

## 📊 Storage Usage Monitoring

### Check total storage used

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY SUM(metadata->>'size')::bigint DESC;
```

### Check per-user storage

```sql
SELECT
  (metadata->>'owner')::uuid as user_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'submission-files'
GROUP BY (metadata->>'owner')::uuid
ORDER BY SUM(metadata->>'size')::bigint DESC
LIMIT 10;
```

---

## 🔄 Migration Notes

If you already have files in old buckets:

### Migrate existing files

```sql
-- Example: Copy from old bucket to new bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT
  'submission-files' as bucket_id,
  name,
  owner,
  metadata
FROM storage.objects
WHERE bucket_id = 'old-bucket-name';
```

---

## 📝 Summary Checklist

Before deploying to production:

- [ ] All 4 buckets created
- [ ] Bucket privacy settings correct (submission-files: private, others: public)
- [ ] File size limits configured
- [ ] MIME type restrictions set
- [ ] All storage policies applied
- [ ] Test uploads from candidate account
- [ ] Test uploads from admin account
- [ ] Test avatar upload
- [ ] Test company logo upload
- [ ] Verify file access permissions
- [ ] Verify reviewers can access assigned submissions
- [ ] Verify candidates cannot access others' files

---

## 🚀 Next Steps

After storage setup:
1. Test file uploads in development
2. Monitor storage usage
3. Set up backup policies (if needed)
4. Configure CDN (if needed for better performance)

---

**Storage is now ready for production use! 🎉**
