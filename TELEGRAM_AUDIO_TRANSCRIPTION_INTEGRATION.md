# Telegram Audio Auto-Transcription Integration

## Overview

This integration adds automatic transcription of Telegram voice messages to Exocortex. When a voice message arrives in Telegram, it is automatically transcribed using OpenAI Whisper and stored in the SSOT database.

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  Telegram   │───▶│ heronclient  │───▶│   n8n       │───▶│ Postgres │
│ Voice Msg   │    │   ingestor   │    │  workflow   │    │  SSOT    │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────┘
                         │                   │              │
                         │                   │              │
                    1. Detect voice      2. Download      3. INSERT
                       message             audio           core.items
                    2. Extract file_id    3. Call         core.documents
                    3. Reply with         transcribe.sh   core.events
                       "processing"       4. Reply
```

## Components

### 1. Updated heronclient ingestor

The Telegram ingestor now detects voice messages and:
- Extracts the audio file_id
- Sends immediate acknowledgement
- Downloads the audio file
- Calls the transcribe.sh script
- Stores transcript in SSOT
- Replies to user with transcript

### 2. n8n webhook workflow (optional)

For advanced orchestration, an n8n workflow can handle:
- Webhook trigger from heronclient
- Audio file download from Telegram API
- Transcription via OpenAI Whisper API
- SSOT storage via PostgreSQL nodes

### 3. Direct integration mode

The default mode uses direct transcription via the existing `transcribe.sh` script, which is already available in the Clawdbot skill system.

## Files Modified

### heronclient/daemon/telegram/ingestor.js

Added voice message handling in the `handleMessage` function:
- Detects `message.voice` or `message.audio` fields
- Downloads audio file using Telegram Bot API
- Calls transcribe.sh for transcription
- Stores result in SSOT
- Replies to user

## Configuration

Add to `.env` or docker-compose:

```bash
# Telegram Audio Transcription
TELEGRAM_VOICE_ENABLED=true
TELEGRAM_AUTO_REPLY=true

# OpenAI API (required for transcribe.sh)
OPENAI_API_KEY=your_api_key_here

# Optional: n8n webhook for advanced orchestration
TELEGRAM_VOICE_N8N_WEBHOOK=http://n8n:5678/webhook/telegram-voice-transcribe
```

## Database Schema

The integration uses existing SSOT tables:

### core.items
```sql
-- For the voice message item
INSERT INTO core.items (
  id, title, description, source, item_type, metadata
) VALUES (
  gen_random_uuid(),
  'Voice message: {timestamp}',
  '{transcript_preview}...',
  'telegram_voice',
  'note',
  '{"chat_id": "...", "message_id": "...", "duration": 45}'
);
```

### core.documents
```sql
-- For the full transcript
INSERT INTO core.documents (
  id, item_id, source, title, content, content_hash, metadata
) VALUES (
  gen_random_uuid(),
  {item_id},
  'telegram_voice',
  'Transcript: {timestamp}',
  '{full_transcript}',
  '{hash}',
  '{"chat_id": "...", "message_id": "...", "duration": 45, "file_id": "..."}'
);
```

### core.events
```sql
-- For audit trail
INSERT INTO core.events (
  event_type, source, payload
) VALUES (
  'audio_transcribed',
  'telegram_voice',
  '{"chat_id": "...", "message_id": "...", "duration": 45, "transcript_length": 1234}'
);
```

## Usage

### Test Command

Once deployed, test the integration:

1. Send a voice message to your Telegram bot
2. The bot will:
   - Immediately reply: "🎤 Processing voice message..."
   - After transcription: Reply with the transcript
3. Check SSOT:
```sql
-- Query recent transcriptions
SELECT 
  i.title,
  d.content as transcript,
  e.created_at as transcribed_at
FROM core.items i
JOIN core.documents d ON i.id = d.item_id
JOIN core.events e ON e.payload->>'message_id' = i.metadata->>'message_id'
WHERE i.source = 'telegram_voice'
ORDER BY e.created_at DESC
LIMIT 10;
```

### Manual Testing

Test the transcribe.sh script directly:
```bash
# Save a voice message as audio.ogg
export OPENAI_API_KEY=your_key
/path/to/transcribe.sh audio.ogg --json

# Check output
cat audio.json
```

## Integration Instructions

### Step 1: Update heronclient

Edit `/home/debian/code/heronclient/daemon/telegram/ingestor.js`:
- See the voice message handling section (search for "voice" or "audio")
- The integration code is already in place in the modified file

### Step 2: Configure environment

Add to `/home/debian/code/heronclient/.env`:
```bash
TELEGRAM_VOICE_ENABLED=true
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Restart heronclient daemon

```bash
cd /home/debian/code/heronclient
./deploy.sh restart
```

### Step 4: Verify transcription

Send a voice message to your bot and check the logs:
```bash
tail -f /home/debian/code/heronclient/daemon/daemon.log
```

## Error Handling

The integration includes:
- Rate limiting to prevent spam
- Automatic retries for failed transcriptions
- Graceful degradation if OpenAI API is unavailable
- Fallback to storing raw audio metadata if transcription fails

## Security Considerations

- Audio files are downloaded temporarily and deleted after transcription
- OpenAI API key is stored securely in environment variables
- Transcripts are stored in the SSOT database with appropriate access controls
- No audio files are stored permanently in the system

## Monitoring

Check transcription status:
```bash
# View recent transcriptions in SSOT
psql -d exocortex -c "
SELECT 
  created_at,
  source,
  event_type,
  payload->>'chat_id' as chat_id,
  payload->>'duration' as duration
FROM core.events 
WHERE event_type = 'audio_transcribed' 
ORDER BY created_at DESC 
LIMIT 10;
"
```

## Troubleshooting

### Issue: Voice messages not being transcribed

**Solution**: Check that:
1. `TELEGRAM_VOICE_ENABLED=true` is set
2. `OPENAI_API_KEY` is configured
3. Heronclient daemon is running: `ps aux | grep heronclient`

### Issue: Transcription timeout

**Solution**: 
- Large audio files may timeout (limit to ~30 seconds)
- Check OpenAI API limits
- Monitor network connectivity

### Issue: Database write errors

**Solution**:
- Verify PostgreSQL connection
- Check SSOT writer is enabled in config
- Review daemon logs for error details

## Performance Notes

- Typical transcription time: 2-10 seconds per minute of audio
- Rate limit: 1 transcription per 5 seconds per chat (configurable)
- Storage: ~1KB per minute of transcribed audio (text only)

## Future Enhancements

- Speaker diarization (multiple voices)
- Translation to other languages
- Integration with knowledge graph
- Audio file storage in object storage (S3-compatible)
- Real-time streaming transcription
