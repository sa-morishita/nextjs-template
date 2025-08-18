# File Storage Architecture

## Overview

The project implements a flexible file storage abstraction layer that supports multiple storage backends with a unified interface. This architecture allows seamless switching between different storage providers without changing application code.

## Architecture Design

### Storage Abstraction Layer
```
src/services/file-storage/
├── types.ts              # Common interfaces and types
├── adapters/             # Storage adapter implementations
│   ├── supabase.ts      # Supabase Storage adapter
│   ├── local.ts         # Local file system adapter
│   └── s3.ts            # AWS S3 adapter (future)
├── factory.ts           # Storage adapter factory
└── index.ts             # Main exports
```

### Core Interfaces

#### StorageAdapter Interface
```typescript
interface StorageAdapter {
  upload(file: File, path: string): Promise<StorageResult>
  delete(path: string): Promise<void>
  getUrl(path: string): Promise<string>
  exists(path: string): Promise<boolean>
  list(prefix: string): Promise<StorageFile[]>
}
```

#### Storage Result
```typescript
interface StorageResult {
  path: string
  url: string
  size: number
  contentType: string
}
```

### Storage Adapters

#### Supabase Storage Adapter
- **Default adapter** for production
- Integrates with Supabase Storage buckets
- Automatic URL generation
- Built-in access control via RLS

#### Local File System Adapter
- Development and testing adapter
- Stores files in `storage/` directory
- Mimics cloud storage behavior
- Used in storage tests (`*.storage.test.ts`)

#### Future Adapters
- AWS S3 adapter planned
- Cloudflare R2 support
- Google Cloud Storage

### Usage Patterns

#### Profile Image Upload
```typescript
// In profile-image.service.ts
const storage = createStorageAdapter(config)
const result = await storage.upload(file, `profiles/${userId}/avatar.jpg`)
```

#### Diary Image Upload
```typescript
// In image-upload.service.ts
const storage = createStorageAdapter(config)
const result = await storage.upload(file, `diaries/${userId}/${diaryId}/${filename}`)
```

### Testing Strategy

#### Storage Tests (`*.storage.test.ts`)
- Mock file system operations
- Test adapter behavior consistency
- Validate error handling
- Performance testing for large files

#### Integration with Services
- Profile image service tests
- Diary attachment tests
- General upload functionality tests

### Configuration

#### Environment Variables
```bash
# Storage adapter selection
STORAGE_ADAPTER="supabase" # or "local", "s3"

# Supabase Storage
SUPABASE_STORAGE_BUCKET="user-uploads"
NEXT_PUBLIC_SUPABASE_URL="..."
SUPABASE_SERVICE_KEY="..."

# Local storage
LOCAL_STORAGE_PATH="./storage"

# AWS S3 (future)
AWS_REGION="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="..."
```

### Security Considerations

#### Access Control
- File paths include user ID for isolation
- Supabase RLS policies enforce access
- Signed URLs for temporary access
- Input validation for file types

#### File Validation
- MIME type checking
- File size limits
- Extension validation
- Virus scanning (future enhancement)

### Best Practices

1. **Always use the abstraction layer** - Never directly access storage providers
2. **Include user context in paths** - `${userId}/${resource}/${filename}`
3. **Validate before upload** - Check file type, size, and content
4. **Handle errors gracefully** - Provide user-friendly error messages
5. **Clean up on deletion** - Remove both database records and files

### Current Implementations

#### Profile Images
- Single avatar per user
- Automatic old image cleanup
- Thumbnail generation (planned)
- CDN integration (planned)

#### Diary Attachments
- Multiple images per diary entry
- Organized by diary ID
- Batch upload support
- Image optimization pipeline

### Future Enhancements

1. **Image Processing**
   - Automatic resizing
   - Format conversion (WebP)
   - Thumbnail generation
   - EXIF data removal

2. **Advanced Features**
   - Chunked uploads for large files
   - Resumable uploads
   - Batch operations
   - Storage analytics

3. **Performance Optimizations**
   - CDN integration
   - Edge caching
   - Lazy loading
   - Progressive image loading

### Migration Strategy

When switching storage providers:
1. Implement new adapter following interface
2. Update environment configuration
3. Run migration script to copy existing files
4. Update storage factory configuration
5. Test thoroughly before switching production