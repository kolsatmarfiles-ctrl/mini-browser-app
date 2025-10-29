# URLs Configuration Guide

This guide explains how to configure which URLs are allowed in the Mini Browser App.

## Where to Configure URLs

### Location in Code

The allowed URLs are defined in: **`app/(tabs)/index.tsx`**

Look for this section (around line 20-26):

```typescript
const DEFAULT_URLS = [
  'https://www.google.com',
  'https://www.github.com',
  'https://www.youtube.com',
  'https://www.wikipedia.org',
];
```

## How to Add URLs Before Building

### Step 1: Open the File
Open `app/(tabs)/index.tsx` in your text editor.

### Step 2: Find the DEFAULT_URLS Array
Search for `const DEFAULT_URLS` in the file.

### Step 3: Add Your URLs
Add your URLs to the array. Each URL should:
- Start with `https://` or `http://`
- Be enclosed in quotes
- End with a comma (except the last one)

### Example:
```typescript
const DEFAULT_URLS = [
  'https://www.google.com',
  'https://www.github.com',
  'https://www.youtube.com',
  'https://www.wikipedia.org',
  'https://www.stackoverflow.com',
  'https://www.reddit.com',
  'https://www.twitter.com',
  'https://www.linkedin.com',
];
```

## URL Format Rules

1. **Must include protocol**: `https://example.com` ✓ | `example.com` ✗
2. **Subdomains are allowed**: `https://mail.google.com` ✓
3. **Paths are allowed**: `https://github.com/user/repo` ✓
4. **No trailing slashes needed**: `https://google.com` ✓ | `https://google.com/` ✓

## How to Add URLs After Building (In the App)

Once the app is installed on your phone:

1. **Open the app**
2. **Tap the "☰ Links" button** (top-left)
3. **Type a new URL** in the text field
   - You can type just the domain: `google.com`
   - Or the full URL: `https://www.google.com`
   - The app will automatically add `https://` if needed
4. **Tap "+ Add"** button
5. **Confirm** when the success message appears

The new URL is immediately saved and available.

## How to Remove URLs

### Before Building (In Code)
Simply delete the line from the `DEFAULT_URLS` array:

```typescript
const DEFAULT_URLS = [
  'https://www.google.com',
  // 'https://www.github.com',  ← Removed this line
  'https://www.youtube.com',
];
```

### After Building (In the App)
1. **Tap "☰ Links"**
2. **Find the URL** you want to remove
3. **Tap the red "✕" button** on the right side of the URL
4. **Confirm** the removal

## Import/Export URLs

### Export Your URLs
1. Tap "☰ Links"
2. Tap "📤 Export"
3. Choose where to save the file
4. A text file with all URLs will be created

### Import URLs from a File
1. Create a text file with URLs (one per line):
```
https://www.google.com
https://www.github.com
https://www.youtube.com
```

2. In the app, tap "☰ Links"
3. Tap "📥 Import"
4. Select your text file
5. All URLs from the file will be added to your allowed list

## Common URLs to Add

### Productivity
```
https://www.google.com
https://www.github.com
https://www.stackoverflow.com
https://www.notion.so
https://www.trello.com
```

### Social Media
```
https://www.twitter.com
https://www.linkedin.com
https://www.reddit.com
https://www.facebook.com
```

### Development
```
https://www.npmjs.com
https://www.python.org
https://www.rust-lang.org
https://www.golang.org
https://www.docker.com
```

### Learning
```
https://www.youtube.com
https://www.wikipedia.org
https://www.coursera.org
https://www.udemy.com
https://www.codecademy.com
```

## URL Matching Rules

The app uses **prefix matching**, which means:

- If you add `https://www.google.com`, you can access:
  - `https://www.google.com` ✓
  - `https://www.google.com/search` ✓
  - `https://www.google.com/maps` ✓
  - `https://mail.google.com` ✗ (different subdomain)

- If you add `https://google.com`, you can access:
  - `https://google.com` ✓
  - `https://google.com/search` ✓
  - `https://www.google.com` ✗ (different subdomain)

## Tips

1. **Be specific with subdomains**: If you want to access `mail.google.com`, add it explicitly
2. **Use HTTPS when possible**: Most modern websites support HTTPS
3. **Test your URLs**: After adding, try to open them in the app
4. **Keep a backup**: Export your URL list regularly

## Troubleshooting

### URL won't load
- Check that it starts with `http://` or `https://`
- Verify the URL is correct by testing in a regular browser
- Check your internet connection

### URL is in the list but still blocked
- Make sure the URL you're trying to visit matches the allowed URL
- Remember: `www.google.com` is different from `google.com`

### Can't import from file
- Make sure the file is a `.txt` file
- Each URL should be on a separate line
- Each URL must start with `http://` or `https://`

## Questions?

If you need help:
1. Check the main `SETUP_INSTRUCTIONS.md` file
2. Review the app code in `app/(tabs)/index.tsx`
3. Test with simple URLs first (like `https://www.google.com`)
