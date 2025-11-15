# Deploy Gemini Chat Function to Supabase

## Issue: Chat not working - Edge function not deployed

### Quick Fix Steps:

## Option 1: Deploy via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bgpykthzyibcjpaulmih
   ```

2. **Navigate to Edge Functions:**
   - Click "Edge Functions" in left sidebar
   - Click "Deploy new function"

3. **Create Function:**
   - Function name: `gemini-safety-chat`
   - Copy content from: `supabase/functions/gemini-safety-chat/index.ts`
   - Click "Deploy"

4. **Add Secret (CRITICAL):**
   - Go to "Project Settings" → "Edge Functions" → "Secrets"
   - Add new secret:
     - Name: `GEMINI_API_KEY`
     - Value: Get from https://aistudio.google.com/app/apikey
   - Click "Save"

5. **Test Function:**
   - In Edge Functions, click your function
   - Click "Test" tab
   - Send test request

---

## Option 2: Install Supabase CLI & Deploy

### Install Supabase CLI:

**Windows (PowerShell):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**OR with npm:**
```bash
npm install -g supabase
```

### Deploy Function:

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref bgpykthzyibcjpaulmih

# Add API key secret
supabase secrets set GEMINI_API_KEY=your_api_key_here

# Deploy the function
supabase functions deploy gemini-safety-chat

# View logs
supabase functions logs gemini-safety-chat
```

---

## Option 3: Manual Deploy via API (If Dashboard doesn't work)

We can deploy using Supabase Management API. Let me create a deployment script.

---

## Testing After Deployment

### Test via curl:
```bash
curl -X POST \
  https://bgpykthzyibcjpaulmih.supabase.co/functions/v1/gemini-safety-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need safety advice"
  }'
```

### Expected Response:
```json
{
  "response": "Hi! I'm SafeGuard AI...",
  "suggested_actions": []
}
```

---

## Troubleshooting

### No logs appearing:
- Function might not be deployed yet
- Check deployment status in dashboard
- Verify function name matches exactly: `gemini-safety-chat`

### "Function not found" error:
- Deploy the function first
- Check project ID matches in config.toml

### "API key not configured" in response:
- Add GEMINI_API_KEY secret in dashboard
- Restart function after adding secret

### CORS errors:
- Already configured in function code
- Make sure you're calling the right URL

---

## Current Configuration

**Project ID:** bgpykthzyibcjpaulmih  
**Supabase URL:** https://bgpykthzyibcjpaulmih.supabase.co  
**Function URL:** https://bgpykthzyibcjpaulmih.supabase.co/functions/v1/gemini-safety-chat  

**Required Secrets:**
- GEMINI_API_KEY (get from Google AI Studio)
