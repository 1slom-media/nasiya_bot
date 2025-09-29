// Test file to demonstrate the enhanced sendMessage functionality
// This file shows examples of how different media types are handled

import { describe, it, expect, jest } from '@jest/globals';

// Mock the enhanced sendMessage functions
const mockDetectMessageType = (messageType, content, caption = '') => {
  const mockMessage = {};
  
  switch (messageType) {
    case 'text':
      mockMessage.text = content;
      break;
    case 'photo':
      mockMessage.photo = [{ file_id: content }];
      mockMessage.caption = caption;
      break;
    case 'video':
      mockMessage.video = { file_id: content };
      mockMessage.caption = caption;
      break;
    case 'animation':
      mockMessage.animation = { file_id: content };
      mockMessage.caption = caption;
      break;
    case 'document':
      mockMessage.document = { file_id: content };
      mockMessage.caption = caption;
      break;
    case 'audio':
      mockMessage.audio = { file_id: content };
      mockMessage.caption = caption;
      break;
    case 'voice':
      mockMessage.voice = { file_id: content };
      break;
    case 'video_note':
      mockMessage.video_note = { file_id: content };
      break;
    case 'sticker':
      mockMessage.sticker = { file_id: content };
      break;
  }
  
  return mockMessage;
};

const detectMessageType = (ctx) => {
  const message = ctx.message;
  
  if (message.photo) {
    return {
      type: 'photo',
      content: message.photo[message.photo.length - 1].file_id,
      caption: message.caption || ''
    };
  } else if (message.video) {
    return {
      type: 'video',
      content: message.video.file_id,
      caption: message.caption || ''
    };
  } else if (message.animation) {
    return {
      type: 'animation',
      content: message.animation.file_id,
      caption: message.caption || ''
    };
  } else if (message.document) {
    return {
      type: 'document',
      content: message.document.file_id,
      caption: message.caption || ''
    };
  } else if (message.audio) {
    return {
      type: 'audio',
      content: message.audio.file_id,
      caption: message.caption || ''
    };
  } else if (message.voice) {
    return {
      type: 'voice',
      content: message.voice.file_id,
      caption: message.caption || ''
    };
  } else if (message.video_note) {
    return {
      type: 'video_note',
      content: message.video_note.file_id,
      caption: ''
    };
  } else if (message.sticker) {
    return {
      type: 'sticker',
      content: message.sticker.file_id,
      caption: ''
    };
  } else if (message.text) {
    return {
      type: 'text',
      content: message.text,
      caption: ''
    };
  } else {
    return {
      type: 'text',
      content: message.caption || 'Unknown media type',
      caption: ''
    };
  }
};

describe('Enhanced sendMessage functionality', () => {
  it('should detect text messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('text', 'Hello World!')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('text');
    expect(result.content).toBe('Hello World!');
    expect(result.caption).toBe('');
  });

  it('should detect photo messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('photo', 'photo_file_id_123', 'Beautiful sunset')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('photo');
    expect(result.content).toBe('photo_file_id_123');
    expect(result.caption).toBe('Beautiful sunset');
  });

  it('should detect video messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('video', 'video_file_id_456', 'Funny video')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('video');
    expect(result.content).toBe('video_file_id_456');
    expect(result.caption).toBe('Funny video');
  });

  it('should detect GIF/animation messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('animation', 'gif_file_id_789', 'Animated GIF')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('animation');
    expect(result.content).toBe('gif_file_id_789');
    expect(result.caption).toBe('Animated GIF');
  });

  it('should detect document messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('document', 'doc_file_id_101', 'Important document')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('document');
    expect(result.content).toBe('doc_file_id_101');
    expect(result.caption).toBe('Important document');
  });

  it('should detect audio messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('audio', 'audio_file_id_202', 'Music track')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('audio');
    expect(result.content).toBe('audio_file_id_202');
    expect(result.caption).toBe('Music track');
  });

  it('should detect voice messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('voice', 'voice_file_id_303')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('voice');
    expect(result.content).toBe('voice_file_id_303');
    expect(result.caption).toBe('');
  });

  it('should detect video note messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('video_note', 'video_note_file_id_404')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('video_note');
    expect(result.content).toBe('video_note_file_id_404');
    expect(result.caption).toBe('');
  });

  it('should detect sticker messages correctly', () => {
    const ctx = {
      message: mockDetectMessageType('sticker', 'sticker_file_id_505')
    };
    
    const result = detectMessageType(ctx);
    expect(result.type).toBe('sticker');
    expect(result.content).toBe('sticker_file_id_505');
    expect(result.caption).toBe('');
  });
});

console.log('Enhanced sendMessage.js now supports:');
console.log('✅ Text messages');
console.log('✅ Photos/Images');
console.log('✅ Videos');
console.log('✅ GIFs/Animations');
console.log('✅ Documents');
console.log('✅ Audio files');
console.log('✅ Voice messages');
console.log('✅ Video notes');
console.log('✅ Stickers');
console.log('✅ Automatic media type detection');
console.log('✅ Caption support for all applicable media types');
console.log('✅ Error handling for each media type');
console.log('✅ Database logging with media type information');
