import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadAllowedUrls();
  }, []);

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

  return (
    <View style={styles.container}>
      {!showUrlList ? (
        <>
          {/* Browser Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowUrlList(true)}
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
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
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

          <ScrollView style={styles.urlListScroll}>
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
                <View key={index} style={styles.urlItem}>
                  <TouchableOpacity
                    style={styles.urlItemContent}
                    onPress={() => handleUrlPress(url)}
                  >
                    <Text style={styles.urlItemText}>{url}</Text>
                    <Text style={styles.urlItemSubtext}>
                      {currentUrl === url ? '✓ Current' : 'Tap to open'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveUrl(url)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
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
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginRight: 10,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  urlDisplay: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlListContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  urlListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  urlListTitle: {
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  urlsListSection: {
    marginBottom: 20,
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  urlItemContent: {
    flex: 1,
  },
  urlItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  urlItemSubtext: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
