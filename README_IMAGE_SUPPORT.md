# Image Support for Quiz Questions

## New Features Added

### 1. Database Schema Update

- Added `imageUrl` column to the `questions` table to store optional image URLs

### 2. Question Builder Enhancement

- Added image upload functionality in the question creation interface
- Teachers can now upload images (JPG, PNG, GIF) up to 5MB in size
- Images are displayed as previews during question creation
- Option to remove uploaded images

### 3. Quiz Taking Enhancement

- Images are displayed to students when taking quizzes
- Images are shown below the question text and above answer options
- Images are responsive and properly sized

### 4. Backend Support

- New `/api/upload/image` endpoint for secure image uploads
- Images are stored in the `/uploads` directory
- Static file serving for uploaded images
- Authentication required - only teachers can upload images

## How to Use

### For Teachers (Creating Quizzes):

1. Navigate to "Create Quiz" page
2. Add a new question
3. In the question builder, you'll see an "Question Image (Optional)" section
4. Click "Upload Image" to select an image file
5. The image will be uploaded and displayed as a preview
6. You can remove the image by clicking the X button
7. Continue adding questions as normal

### For Students (Taking Quizzes):

1. When taking a quiz, if a question has an image, it will be displayed
2. The image appears between the question text and answer options
3. Images are properly sized and responsive

## Technical Details

### File Upload Restrictions:

- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF
- Only teachers can upload images
- Images are stored locally in `/uploads` directory

### API Endpoints:

- `POST /api/upload/image` - Upload image (requires authentication)
- `GET /uploads/:filename` - Serve uploaded images

### Security:

- Authentication required for uploads
- File type validation
- File size limits
- Only image files accepted

## Files Modified:

1. `shared/schema.ts` - Added imageUrl field to questions table
2. `client/src/pages/create-quiz.tsx` - Updated QuestionData interface
3. `client/src/components/question-builder.tsx` - Added image upload UI
4. `client/src/pages/take-quiz.tsx` - Added image display for students
5. `server/routes.ts` - Added image upload endpoint and static file serving

## Migration:

The database schema has been updated automatically using `npm run db:push`.
