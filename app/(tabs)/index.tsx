import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler,
  AppState,
  Keyboard,
  KeyboardEvent,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'allowed_urls';
const DEFAULT_URLS = [
  'https://www.google.com',
  'https://www.github.com',
  'https://www.youtube.com',
  'https://www.wikipedia.org',
];

export default function BrowserScreen() {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [allowedUrls, setAllowedUrls] = useState<string[]>(DEFAULT_URLS);
  const [showUrlList, setShowUrlList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedUrlIndex, setSelectedUrlIndex] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadAllowedUrls();
    setupBackHandler();
    setupKeyboardListener();
  }, []);

  // Setup Back Button Handler
  const setupBackHandler = () => {
    const backAction = () => {
      if (showUrlList) {
        setShowUrlList(false);
        return true;
      }
      // If in webview, go back in history
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => subscription.remove();
  };

  // Setup Keyboard Listener for Arrow Keys and other controls
  const setupKeyboardListener = () => {
    const subscription = Keyboard.addListener('keyboardDidShow', (event) => {
      // Handle keyboard events
    });

    return () => subscription.remove();
  };

  const loadAllowedUrls = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAllowedUrls(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading URLs:', error);
    }
  };

  const saveAllowedUrls = async (urls: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
      setAllowedUrls(urls);
    } catch (error) {
      console.error('Error saving URLs:', error);
      Alert.alert('Error', 'Failed to save URLs');
    }
  };

  const isUrlAllowed = (url: string): boolean => {
    return allowedUrls.some((allowedUrl) =>
      url.toLowerCase().startsWith(allowedUrl.toLowerCase())
    );
  };

  const handleUrlPress = (url: string) => {
    if (isUrlAllowed(url)) {
      setCurrentUrl(url);
      setShowUrlList(false);
    } else {
      Alert.alert('Access Denied', `${url} is not in the allowed list`);
    }
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (allowedUrls.includes(url)) {
      Alert.alert('Error', 'This URL is already in the list');
      return;
    }

    const newUrls = [...allowedUrls, url];
    saveAllowedUrls(newUrls);
    setNewUrl('');
    Alert.alert('Success', 'URL added to allowed list');
  };

  const handleRemoveUrl = (url: string) => {
    Alert.alert('Remove URL', `Remove ${url}?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Remove',
        onPress: () => {
          const newUrls = allowedUrls.filter((u) => u !== url);
          saveAllowedUrls(newUrls);
          if (currentUrl === url) {
            setCurrentUrl(allowedUrls[0] || 'https://www.google.com');
          }
        },
      },
    ]);
  };

  const handleExportUrls = async () => {
    try {
      const content = allowedUrls.join('\n');
      const fileName = `urls_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export URLs');
    }
  };

  const handleImportUrls = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        const urls = content
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url.startsWith('http://') || url.startsWith('https://'));

        if (urls.length === 0) {
          Alert.alert('Error', 'No valid URLs found in file');
          return;
        }

        const newUrls = Array.from(new Set([...allowedUrls, ...urls]));
        saveAllowedUrls(newUrls);
        Alert.alert('Success', `Imported ${urls.length} URLs`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import URLs');
    }
  };

  // Navigate to next URL with arrow keys
  const navigateUrlList = (direction: 'up' | 'down') => {
    if (!showUrlList) return;

    let newIndex = selectedUrlIndex;
    if (direction === 'up' && selectedUrlIndex > 0) {
      newIndex = selectedUrlIndex - 1;
    } else if (direction === 'down' && selectedUrlIndex < allowedUrls.length - 1) {
      newIndex = selectedUrlIndex + 1;
    }

    setSelectedUrlIndex(newIndex);
    // Scroll to selected item
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: newIndex * 80,
        animated: true,
      });
    }
  };

  // Scroll webview with arrow keys
  const scrollWebView = (direction: 'up' | 'down') => {
    if (showUrlList || !webViewRef.current) return;

    const scrollAmount = direction === 'up' ? -100 : 100;
    webViewRef.current.injectJavaScript(`
      window.scrollBy(0, ${scrollAmount});
      true;
    `);
  };

  return (
    <View style={styles.container}>
      {!showUrlList ? (
        <>
          {/* Browser Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setShowUrlList(true);
                setSelectedUrlIndex(0);
              }}
            >
              <Text style={styles.menuButtonText}>☰ Links</Text>
            </TouchableOpacity>
            <Text style={styles.urlDisplay} numberOfLines={1}>
              {currentUrl}
            </Text>
          </View>

          {/* WebView */}
          {currentUrl ? (
            <WebView
              ref={webViewRef}
              source={{ uri: currentUrl }}
              style={styles.webview}
              userAgent={
                Platform.OS === 'android'
                  ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  : undefined
              }
              onNavigationStateChange={(navState) => {
                if (!isUrlAllowed(navState.url)) {
                  Alert.alert(
                    'Access Denied',
                    'You can only visit allowed links'
                  );
                }
              }}
              scrollEnabled={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}

          {/* Bottom Controls for Flip Phone */}
          <View style={styles.controlsBar}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => webViewRef.current?.goBack()}
            >
              <Text style={styles.controlButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => webViewRef.current?.goForward()}
            >
              <Text style={styles.controlButtonText}>Forward →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => webViewRef.current?.reload()}
            >
              <Text style={styles.controlButtonText}>⟳ Reload</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* URL Management Screen */
        <View style={styles.urlListContainer}>
          <View style={styles.urlListHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowUrlList(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.urlListTitle}>Allowed Links</Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.urlListScroll}
            scrollEnabled={true}
          >
            {/* Add New URL Section */}
            <View style={styles.addUrlSection}>
              <TextInput
                style={styles.urlInput}
                placeholder="Enter new URL (e.g., google.com)"
                value={newUrl}
                onChangeText={setNewUrl}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddUrl}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {/* Import/Export Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleImportUrls}
              >
                <Text style={styles.actionButtonText}>📥 Import</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleExportUrls}
              >
                <Text style={styles.actionButtonText}>📤 Export</Text>
              </TouchableOpacity>
            </View>

            {/* URL List */}
            <View style={styles.urlsListSection}>
              {allowedUrls.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.urlItem,
                    selectedUrlIndex === index && styles.urlItemSelected,
                  ]}
                  onPress={() => handleUrlPress(url)}
                >
                  <View style={styles.urlItemContent}>
                    <Text style={styles.urlItemText}>{url}</Text>
                    <Text style={styles.urlItemSubtext}>
                      {currentUrl === url ? '✓ Current' : 'Tap to open'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveUrl(url)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* URL List Controls */}
          <View style={styles.urlListControls}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateUrlList('up')}
            >
              <Text style={styles.navButtonText}>▲ Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateUrlList('down')}
            >
              <Text style={styles.navButtonText}>▼ Down</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => handleUrlPress(allowedUrls[selectedUrlIndex])}
            >
              <Text style={styles.navButtonText}>✓ Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginRight: 12,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  urlDisplay: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 10,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  urlListContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  urlListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  urlListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  urlListScroll: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  addUrlSection: {
    marginBottom: 20,
  },
  urlInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  urlsListSection: {
    marginBottom: 20,
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
  },
  urlItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#FF9500',
  },
  urlItemContent: {
    flex: 1,
  },
  urlItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  urlItemSubtext: {
    fontSize: 13,
    color: '#999',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  urlListControls: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
