import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  BackHandler,
  Modal,
  TextInput,
} from "react-native";
import Video from "react-native-video";
import * as ScreenOrientation from "expo-screen-orientation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseXtreamChannels, Channel, Category } from "./src/utils/m3uParser";

const STORAGE_SERVER = "@xtream_server";
const STORAGE_USER = "@xtream_user";
const STORAGE_PASS = "@xtream_pass";
const STORAGE_FAVS = "@xtream_favorites";

const DEFAULT_SERVER = "http://line.tivi-ott.net:80";
const DEFAULT_USER = "REWKDQ";
const DEFAULT_PASS = "YV6872";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [serverInput, setServerInput] = useState<string>(DEFAULT_SERVER);
  const [userInput, setUserInput] = useState<string>(DEFAULT_USER);
  const [passInput, setPassInput] = useState<string>(DEFAULT_PASS);

  useEffect(() => {
    async function init() {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      );
      loadSavedFavorites();
      loadSavedCredentials();
    }
    init();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isModalOpen) {
        setIsModalOpen(false);
        return true;
      }
      if (isFullscreen) {
        setIsFullscreen(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [isFullscreen, isModalOpen]);

  // Kategori ve Arama Değiştiğinde Filtrele
  useEffect(() => {
    let result = allChannels;

    // 1. Kategori Filtresi
    if (selectedCategoryId === "favorites") {
      result = result.filter((c) => favorites.includes(c.id));
    } else if (selectedCategoryId !== "all") {
      result = result.filter((c) => c.group === selectedCategoryId);
    }

    // 2. Arama Filtresi
    if (searchQuery.trim() !== "") {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredChannels(result);
  }, [selectedCategoryId, searchQuery, allChannels, favorites]);

  const loadSavedFavorites = async () => {
    try {
      const savedFavs = await AsyncStorage.getItem(STORAGE_FAVS);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error("Favoriler yüklenemedi:", e);
    }
  };

  const toggleFavorite = async (channelId: string) => {
    try {
      let updatedFavs: string[];
      if (favorites.includes(channelId)) {
        updatedFavs = favorites.filter((id) => id !== channelId);
      } else {
        updatedFavs = [...favorites, channelId];
      }
      setFavorites(updatedFavs);
      await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify(updatedFavs));
    } catch (e) {
      console.error("Favori kaydedilemedi:", e);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const savedServer =
        (await AsyncStorage.getItem(STORAGE_SERVER)) || DEFAULT_SERVER;
      const savedUser =
        (await AsyncStorage.getItem(STORAGE_USER)) || DEFAULT_USER;
      const savedPass =
        (await AsyncStorage.getItem(STORAGE_PASS)) || DEFAULT_PASS;

      setServerInput(savedServer);
      setUserInput(savedUser);
      setPassInput(savedPass);

      fetchXtreamData(savedServer, savedUser, savedPass);
    } catch (e) {
      fetchXtreamData(DEFAULT_SERVER, DEFAULT_USER, DEFAULT_PASS);
    }
  };

  const fetchXtreamData = async (
    server: string,
    user: string,
    pass: string,
  ) => {
    try {
      setLoading(true);

      let cleanServer = server.trim().replace(/\s+/g, "").replace(/\/+$/, "");
      const cleanUser = user.trim().replace(/\s+/g, "");
      const cleanPass = pass.trim().replace(/\s+/g, "");

      if (cleanServer.startsWith("https://")) {
        cleanServer = cleanServer.replace("https://", "http://");
      }
      if (!cleanServer.startsWith("http://")) {
        cleanServer = `http://${cleanServer}`;
      }

      const categoriesUrl = `${cleanServer}/player_api.php?username=${cleanUser}&password=${cleanPass}&action=get_live_categories`;
      const streamUrl = `${cleanServer}/player_api.php?username=${cleanUser}&password=${cleanPass}&action=get_live_streams`;

      // Zaman aşımını 45 saniyeye çıkarıyoruz
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const requestHeaders = {
        "User-Agent": "IPTVSmartersPro/3.1.5",
        Accept: "*/*",
      };

      // 1. Kategorileri Çek
      let catData: any[] = [];
      try {
        const catRes = await fetch(categoriesUrl, {
          method: "GET",
          headers: requestHeaders,
          signal: controller.signal,
        });
        if (catRes.ok) catData = await catRes.json();
      } catch (e) {
        console.warn("Kategoriler alınamadı, varsayılan mod devam ediyor:", e);
      }

      // 2. Kanalları Çek
      const streamRes = await fetch(streamUrl, {
        method: "GET",
        headers: {
          "User-Agent": "IPTVSmartersPro/3.1.5",
          Accept: "*/*",
          Connection: "keep-alive",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!streamRes.ok) {
        throw new Error(`Sunucu Yanıtı: ${streamRes.status}`);
      }

      const streamData = await streamRes.json();

      if (Array.isArray(streamData)) {
        if (streamData.length === 0) {
          alert("Kullanıcı bilgileri doğru fakat kanal bulunamadı.");
          return;
        }

        // Kategori ID -> Kategori Adı
        const categoryMap: { [key: string]: string } = {};
        if (Array.isArray(catData)) {
          catData.forEach((c: any) => {
            categoryMap[c.category_id] = c.category_name;
          });
        }

        // "LIVE | " temizliği ve kategori adı eşleme
        const enrichedStreamData = streamData.map((item: any) => ({
          ...item,
          name: item.name
            ? item.name.replace(/^LIVE\s*[:|-]?\s*/i, "").trim()
            : item.name,
          category_name: categoryMap[item.category_id] || "Diğer",
        }));

        const parsed = parseXtreamChannels(
          enrichedStreamData,
          cleanServer,
          cleanUser,
          cleanPass,
        );

        setAllChannels(parsed);
        setFilteredChannels(parsed);

        // Kategori Menüsü
        const generatedCategories: Category[] = [
          { category_id: "all", category_name: "🌐 TÜM KANALLAR" },
          { category_id: "favorites", category_name: "⭐ FAVORİLER" },
        ];

        if (Array.isArray(catData) && catData.length > 0) {
          catData.forEach((c: any) => {
            generatedCategories.push({
              category_id: c.category_name,
              category_name: c.category_name,
            });
          });
        } else {
          // Kategoriler çekilemezse kanalların grubundan üret
          const uniqueGroups = new Set<string>();
          parsed.forEach((ch) => {
            if (ch.group) uniqueGroups.add(ch.group);
          });
          Array.from(uniqueGroups)
            .sort()
            .forEach((grp) => {
              generatedCategories.push({
                category_id: grp,
                category_name: grp,
              });
            });
        }

        setCategories(generatedCategories);

        if (parsed.length > 0) {
          setSelectedChannel(parsed[0]);
        }
      } else {
        alert("Sunucu geçersiz yanıt döndürdü.");
      }
    } catch (error: any) {
      console.error("Xtream Fetch Hatası:", error);
      if (error.name === "AbortError") {
        alert(
          "Bağlantı zaman aşımına uğradı (45s). Sunucu çok yavaş yanıt veriyor.",
        );
      } else {
        alert(`Kanallar yüklenemedi: ${error?.message || "Ağ Hatası"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!serverInput.trim() || !userInput.trim() || !passInput.trim()) return;
    await AsyncStorage.setItem(STORAGE_SERVER, serverInput.trim());
    await AsyncStorage.setItem(STORAGE_USER, userInput.trim());
    await AsyncStorage.setItem(STORAGE_PASS, passInput.trim());
    setIsModalOpen(false);
    fetchXtreamData(serverInput.trim(), userInput.trim(), passInput.trim());
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Kanallar Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isFullscreen && (
        <>
          {/* Sol Sütun: Kategoriler */}
          <View style={styles.categoryContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Kategoriler</Text>
              <Pressable
                style={({ focused }: any) => [
                  styles.settingsBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => setIsModalOpen(true)}
              >
                <Text style={styles.settingsBtnText}>⚙️</Text>
              </Pressable>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.category_id}
              renderItem={({ item }) => {
                const isSelected = selectedCategoryId === item.category_id;
                const isFocused = focusedId === `cat_${item.category_id}`;
                return (
                  <Pressable
                    style={[
                      styles.categoryCard,
                      isSelected && styles.selectedCategoryCard,
                      isFocused && styles.focusedCard,
                    ]}
                    focusable={true}
                    hasTVPreferredFocus={item.category_id === "all"}
                    onFocus={() => setFocusedId(`cat_${item.category_id}`)}
                    onPress={() => setSelectedCategoryId(item.category_id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.selectedCategoryText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.category_name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* Orta Sütun: Arama Çubuğu & Kanal Listesi */}
          <View style={styles.channelContainer}>
            <Text style={styles.headerTitle}>
              Kanallar ({filteredChannels.length})
            </Text>

            {/* Arama Kutusu */}
            <TextInput
              style={[
                styles.searchInput,
                focusedId === "search_input" && styles.focusedCard,
              ]}
              placeholder="🔍 Kanal Ara..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedId("search_input")}
            />

            <FlatList
              data={filteredChannels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isPlaying = selectedChannel?.id === item.id;
                const isFocused = focusedId === `ch_${item.id}`;
                const isFav = favorites.includes(item.id);

                return (
                  <Pressable
                    style={[
                      styles.channelCard,
                      isPlaying && styles.playingCard,
                      isFocused && styles.focusedCard,
                    ]}
                    focusable={true}
                    onFocus={() => setFocusedId(`ch_${item.id}`)}
                    onPress={() => {
                      if (selectedChannel?.id === item.id) {
                        setIsFullscreen(true);
                      } else {
                        setVideoError(null);
                        setIsVideoLoading(true);
                        setSelectedChannel(item);
                      }
                    }}
                  >
                    {item.logo ? (
                      <Image
                        source={{ uri: item.logo }}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.logo, styles.noLogo]}>
                        <Text style={styles.noLogoText}>TV</Text>
                      </View>
                    )}
                    <Text style={styles.channelName} numberOfLines={1}>
                      {isPlaying ? `▶ ${item.name}` : item.name}
                    </Text>

                    {/* Favori Yıldız Butonu */}
                    <Pressable
                      style={styles.favButton}
                      focusable={true}
                      onPress={() => toggleFavorite(item.id)}
                    >
                      <Text style={styles.favText}>{isFav ? "⭐" : "☆"}</Text>
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          </View>
        </>
      )}

      {/* Sağ Sütun: Video Player */}
      <View
        style={
          isFullscreen ? styles.fullPlayerContainer : styles.playerContainer
        }
      >
        {selectedChannel ? (
          <Pressable
            style={styles.videoWrapper}
            focusable={true}
            onPress={() => setIsFullscreen(!isFullscreen)}
          >
            <Video
              source={{ uri: selectedChannel.url }}
              style={styles.fullVideo}
              controls={false}
              resizeMode={isFullscreen ? "cover" : "contain"}
              onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
              onLoad={() => setIsVideoLoading(false)}
              onError={() => {
                setIsVideoLoading(false);
                setVideoError("Yayın kapalı veya desteklenmeyen format.");
              }}
            />
            {isVideoLoading && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            )}
            {videoError && (
              <View style={styles.overlay}>
                <Text style={styles.errorText}>⚠️ {videoError}</Text>
              </View>
            )}
          </Pressable>
        ) : (
          <Text style={styles.placeholderText}>Kanal Seçin</Text>
        )}
      </View>

      {/* Giriş Modalı */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xtream Codes Girişi</Text>
            <TextInput
              style={styles.input}
              value={serverInput}
              onChangeText={setServerInput}
              placeholder="Server URL"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              value={passInput}
              onChangeText={setPassInput}
              placeholder="Şifre"
              secureTextEntry
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.btn, styles.saveBtn]}
                focusable={true}
                onPress={handleSaveCredentials}
              >
                <Text style={styles.btnText}>Kaydet</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.cancelBtn]}
                focusable={true}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.btnText}>İptal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#121212" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: { color: "#FFF", marginTop: 10 },
  categoryContainer: { width: "22%", backgroundColor: "#1A1A1A", padding: 8 },
  channelContainer: { width: "28%", backgroundColor: "#222222", padding: 8 },
  playerContainer: {
    width: "50%",
    height: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPlayerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  settingsBtn: { backgroundColor: "#333", padding: 4, borderRadius: 4 },
  settingsBtnText: { color: "#FFF", fontSize: 12 },
  searchInput: {
    backgroundColor: "#111",
    color: "#FFF",
    padding: 6,
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  categoryCard: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#282828",
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selectedCategoryCard: { backgroundColor: "#3A3A88", borderColor: "#8888FF" },
  categoryText: { color: "#AAA", fontSize: 12, fontWeight: "500" },
  selectedCategoryText: { color: "#FFF", fontWeight: "bold" },
  channelCard: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#2D2D2D",
    marginBottom: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  playingCard: { backgroundColor: "#1B3B1B", borderColor: "#00FF66" },
  focusedCard: {
    borderColor: "#FFD700",
    backgroundColor: "#3D3D88",
    borderWidth: 2,
    transform: [{ scale: 1.03 }],
  },
  logo: { width: 28, height: 28, borderRadius: 4, marginRight: 8 },
  noLogo: {
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
  },
  noLogoText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  channelName: { color: "#FFF", fontSize: 12, flex: 1 },
  favButton: { paddingHorizontal: 6, paddingVertical: 2 },
  favText: { color: "#FFD700", fontSize: 14 },
  videoWrapper: { width: "100%", height: "100%" },
  fullVideo: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: "#FF4444", fontWeight: "bold" },
  placeholderText: { color: "#666" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "40%",
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 8,
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#111",
    color: "#FFF",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveBtn: { backgroundColor: "#28a745" },
  cancelBtn: { backgroundColor: "#dc3545" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  focusedBtn: {
    borderColor: "#FFD700",
    backgroundColor: "#5555AA",
    borderWidth: 1.5,
  },
});
