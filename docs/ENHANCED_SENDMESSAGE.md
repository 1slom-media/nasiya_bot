# Enhanced sendMessage.js Functionality

## Overview

The `sendMessage.js` function has been enhanced to support multiple media types beyond just text messages. It can now handle various types of media content and send them to groups accordingly.

## Supported Media Types

### 1. Text Messages ✅
- **Type**: `text`
- **Usage**: Send plain text messages
- **Example**: "Hello, this is a text message!"

### 2. Photos/Images ✅
- **Type**: `photo`
- **Usage**: Send image files (JPEG, PNG, etc.)
- **Features**: 
  - Automatically selects highest quality image
  - Supports captions
  - HTML parsing for captions

### 3. Videos ✅
- **Type**: `video`
- **Usage**: Send video files (MP4, AVI, etc.)
- **Features**:
  - Supports captions
  - HTML parsing for captions

### 4. GIFs/Animations ✅
- **Type**: `animation`
- **Usage**: Send animated GIF files
- **Features**:
  - Supports captions
  - HTML parsing for captions

### 5. Documents ✅
- **Type**: `document`
- **Usage**: Send any file type as document
- **Features**:
  - Supports captions
  - HTML parsing for captions

### 6. Audio Files ✅
- **Type**: `audio`
- **Usage**: Send audio files (MP3, WAV, etc.)
- **Features**:
  - Supports captions
  - HTML parsing for captions

### 7. Voice Messages ✅
- **Type**: `voice`
- **Usage**: Send voice recordings
- **Features**:
  - Optimized for voice messages
  - No caption support (Telegram limitation)

### 8. Video Notes ✅
- **Type**: `video_note`
- **Usage**: Send circular video messages
- **Features**:
  - Optimized for video notes
  - No caption support (Telegram limitation)

### 9. Stickers ✅
- **Type**: `sticker`
- **Usage**: Send sticker files
- **Features**:
  - Direct sticker sending
  - No caption support (Telegram limitation)

## Key Features

### Automatic Media Type Detection
The system automatically detects the type of media being sent:

```javascript
const detectMessageType = (ctx) => {
  const message = ctx.message;
  
  if (message.photo) return { type: 'photo', ... };
  if (message.video) return { type: 'video', ... };
  if (message.animation) return { type: 'animation', ... };
  // ... and so on
};
```

### Intelligent Message Sending
Different media types are sent using appropriate Telegram API methods:

```javascript
switch (type) {
  case 'photo':
    await ctx.telegram.sendPhoto(groupId, content, options);
    break;
  case 'video':
    await ctx.telegram.sendVideo(groupId, content, options);
    break;
  // ... and so on
}
```

### Enhanced User Feedback
Users receive detailed feedback about what was sent:

```
✅ Xabar muvaffaqiyatli yuborildi!
📊 Media turi: photo
📝 Caption: Beautiful sunset photo
```

### Database Logging
All messages are logged to the database with media type information:

```javascript
const messageForDb = messageData.type === 'text' 
  ? messageData.content 
  : `[${messageData.type.toUpperCase()}] ${messageData.caption || 'Media fayl'}`;
```

## Usage Instructions

### For Administrators

1. **Access the Send Message Feature**
   - Use the bot command for sending messages to groups
   - Select "Send Message" from the admin menu

2. **Send Different Media Types**
   - **Text**: Simply type your message
   - **Photo**: Send an image file with optional caption
   - **Video**: Send a video file with optional caption
   - **GIF**: Send an animated GIF with optional caption
   - **Document**: Send any file as a document with optional caption
   - **Audio**: Send an audio file with optional caption
   - **Voice**: Record and send a voice message
   - **Video Note**: Record and send a circular video
   - **Sticker**: Send a sticker

3. **Confirmation**
   - The system will confirm successful sending
   - Shows media type and caption information
   - Provides error messages if sending fails

### Error Handling

The enhanced system includes robust error handling:

- **Individual Group Failures**: If sending fails to one group, it continues with others
- **Media Type Fallback**: Unknown media types fall back to text messages
- **User-Friendly Error Messages**: Clear error messages in user's language
- **Detailed Logging**: Console logging for debugging purposes

## Technical Implementation

### Core Functions

1. **`detectMessageType(ctx)`**: Analyzes incoming message and determines media type
2. **`sendMediaToGroup(ctx, groupId, messageData)`**: Sends appropriate media type to a specific group
3. **`sendMessagesInChunks(ctx, resGroups, messageData)`**: Handles bulk sending with rate limiting

### Rate Limiting

- **Chunk Size**: 50 groups per batch (configurable)
- **Delay**: 30 seconds between batches (configurable)
- **Error Recovery**: Continues processing even if individual sends fail

### Database Integration

- Messages are stored with media type information
- Caption text is preserved in database
- Admin information is logged for audit purposes

## Benefits

1. **Versatility**: Support for all major Telegram media types
2. **User Experience**: Clear feedback and error handling
3. **Reliability**: Robust error handling and rate limiting
4. **Maintainability**: Clean, modular code structure
5. **Scalability**: Efficient batch processing for large group lists
6. **Audit Trail**: Complete logging of all sent messages

## Migration from Old Version

The enhanced version is backward compatible:
- Existing text message functionality remains unchanged
- New media support is automatically available
- No changes required to existing bot commands or database schema
- Enhanced user feedback provides better experience

## Testing

Run the test suite to verify functionality:

```bash
npm test test/sendMessage.test.js
```

The test suite covers all media types and edge cases to ensure reliable operation.
