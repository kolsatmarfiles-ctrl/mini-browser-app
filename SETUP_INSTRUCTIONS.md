# Mini Browser App - Setup Instructions

This is a React Native Expo application that acts as a restricted browser, allowing access only to a predefined list of URLs.

## Features

- **Restricted Browsing**: Only access URLs that are in your allowed list
- **Link Management**: Add, remove, and manage allowed URLs
- **Import/Export**: Import URLs from a file or export your current list
- **Desktop Mode**: Automatically uses desktop user agent for all websites
- **File Operations**: Upload and download files through the browser
- **Settings**: Persistent storage of your allowed URLs

## Prerequisites

Before building the APK, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (install globally: `npm install -g expo-cli`)
4. **Android Studio** (for building APK) or **EAS CLI** (for cloud builds)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/kolsatmar/mini-browser-app.git
cd mini-browser-app
```

2. Install dependencies:
```bash
npm install
```

## Configuring Allowed URLs

### Option 1: Edit in the App
1. Run the app
2. Tap the "☰ Links" button
3. Add new URLs using the input field
4. URLs are automatically saved

### Option 2: Edit Before Building
Edit the `DEFAULT_URLS` array in `app/(tabs)/index.tsx`:

```typescript
const DEFAULT_URLS = [
  'https://www.google.com',
  'https://www.github.com',
  'https://www.youtube.com',
  'https://www.wikipedia.org',
  // Add your URLs here
];
```

## Building the APK

### Method 1: Using Expo EAS (Recommended - Easiest)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Log in to Expo:
```bash
eas login
```

3. Build the APK:
```bash
eas build --platform android --local
```

The APK will be generated and you'll get a download link.

### Method 2: Using Android Studio

1. Install Expo development client:
```bash
npx expo prebuild --clean
```

2. Open the generated `android` folder in Android Studio

3. Build the APK:
   - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
   - Wait for the build to complete
   - The APK will be in `android/app/build/outputs/apk/release/`

### Method 3: Using Gradle Command Line

1. Prebuild the project:
```bash
npx expo prebuild --clean
```

2. Build the APK:
```bash
cd android
./gradlew assembleRelease
cd ..
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Testing

### Test on Emulator
```bash
npm run android
```

### Test on Physical Device
1. Install Expo Go app from Google Play Store
2. Run:
```bash
npm start
```
3. Scan the QR code with Expo Go

## Project Structure

```
mini-browser-app/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx          # Main browser component
│   ├── _layout.tsx            # Root layout
│   └── modal.tsx              # Modal screen
├── assets/                    # Images and icons
├── components/                # Reusable components
├── constants/                 # App constants
├── hooks/                     # Custom React hooks
├── app.json                   # Expo configuration
├── package.json              # Dependencies
└── SETUP_INSTRUCTIONS.md     # This file
```

## Key Files to Customize

### `app/(tabs)/index.tsx`
This is the main browser component. Customize:
- `DEFAULT_URLS`: Change the default allowed URLs
- `styles`: Modify the app appearance
- URL validation logic in `isUrlAllowed()`

### `app.json`
Configure:
- App name
- Icon and splash screen
- Android permissions
- App version

## Permissions Required

The app requests:
- **INTERNET**: To browse websites
- **READ_EXTERNAL_STORAGE**: To import URL files
- **WRITE_EXTERNAL_STORAGE**: To export URL files

These are automatically configured in `app.json`.

## Troubleshooting

### Build fails with "gradle not found"
```bash
npx expo prebuild --clean
```

### APK is too large
The APK size is typically 50-80MB. This is normal for React Native apps.

### App crashes on startup
Check the console for errors:
```bash
npm start -- --verbose
```

### WebView not loading
Ensure the URL starts with `http://` or `https://`

## Importing URLs from a File

1. Create a text file with URLs (one per line):
```
https://www.google.com
https://www.github.com
https://www.youtube.com
```

2. In the app, tap "📥 Import"
3. Select your text file
4. URLs will be added to your allowed list

## Exporting URLs

1. In the app, tap "📤 Export"
2. Choose where to save the file
3. Your URLs will be saved as a text file

## Updating the App

To update to a new version:

1. Make your changes
2. Update the version in `app.json`:
```json
"version": "1.0.1"
```

3. Rebuild the APK following the build instructions above

## Support

For issues or questions:
1. Check the Expo documentation: https://docs.expo.dev
2. Check React Native documentation: https://reactnative.dev
3. Open an issue on GitHub

## License

This project is open source and available under the MIT License.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Development](https://developer.android.com)
