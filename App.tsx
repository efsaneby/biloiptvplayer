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
  ScrollView,
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

type ScreenType = "dashboard" | "live" | "movies" | "series";

interface VodItem {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  container_extension: string;
  rating?: string;
}

interface SeriesItem {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
  plot?: string;
  rating?: string;
}

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("dashboard");

  // Live State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Movies State
  const [movieCategories, setMovieCategories] = useState<Category[]>([]);
  const [selectedMovieCatId, setSelectedMovieCatId] = useState<string>("all");
  const [allMovies, setAllMovies] = useState<VodItem[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<VodItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<VodItem | null>(null);
  const [moviesLoaded, setMoviesLoaded] = useState<boolean>(false);
  const [moviesLoading, setMoviesLoading] = useState<boolean>(false);

  // Series State
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [selectedSeriesCatId, setSelectedSeriesCatId] = useState<string>("all");
  const [allSeries, setAllSeries] = useState<SeriesItem[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<SeriesItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [episodes, setEpisodes] = useState<{ [season: string]: Episode[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seriesLoading, setSeriesLoading] = useState<boolean>(false);
  const [seriesLoaded, setSeriesLoaded] = useState<boolean>(false);

  // General Playback & UI State
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auth State
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
        setActiveMediaUrl(null);
        return true;
      }
      if (selectedSeries) {
        setSelectedSeries(null);
        setEpisodes({});
        return true;
      }
      if (currentScreen !== "dashboard") {
        setCurrentScreen("dashboard");
        setSelectedMovie(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [isFullscreen, isModalOpen, currentScreen, selectedSeries]);

  // Canlı Yayın Filtreleme
  useEffect(() => {
    let result = allChannels;
    if (selectedCategoryId === "favorites") {
      result = result.filter((c) => favorites.includes(c.id));
    } else if (selectedCategoryId !== "all") {
      result = result.filter((c) => c.group === selectedCategoryId);
    }
    if (searchQuery.trim() !== "") {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredChannels(result);
  }, [selectedCategoryId, searchQuery, allChannels, favorites]);

  // Film Filtreleme
  useEffect(() => {
    let result = allMovies;
    if (selectedMovieCatId !== "all") {
      result = result.filter((m) => m.category_id === selectedMovieCatId);
    }
    if (searchQuery.trim() !== "") {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredMovies(result);
  }, [selectedMovieCatId, searchQuery, allMovies]);

  // Dizi Filtreleme
  useEffect(() => {
    let result = allSeries;
    if (selectedSeriesCatId !== "all") {
      result = result.filter((s) => s.category_id === selectedSeriesCatId);
    }
    if (searchQuery.trim() !== "") {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredSeries(result);
  }, [selectedSeriesCatId, searchQuery, allSeries]);

  const loadSavedFavorites = async () => {
    try {
      const savedFavs = await AsyncStorage.getItem(STORAGE_FAVS);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (channelId: string) => {
    try {
      let updated = favorites.includes(channelId)
        ? favorites.filter((id) => id !== channelId)
        : [...favorites, channelId];
      setFavorites(updated);
      await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
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

  const cleanUrl = (url: string) => {
    let clean = url.trim().replace(/\s+/g, "").replace(/\/+$/, "");
    if (clean.startsWith("https://"))
      clean = clean.replace("https://", "http://");
    if (!clean.startsWith("http://")) clean = `http://${clean}`;
    return clean;
  };

  // Sadece Canlı Yayınları Yükler (Sistemi Yormaz ve Kesintisizdir)
  const fetchXtreamData = async (
    server: string,
    user: string,
    pass: string,
  ) => {
    try {
      setLoading(true);
      setMoviesLoaded(false);
      setSeriesLoaded(false);

      const cleanServer = cleanUrl(server);
      const cleanUser = user.trim().replace(/\s+/g, "");
      const cleanPass = pass.trim().replace(/\s+/g, "");

      const headers = { "User-Agent": "IPTVSmartersPro/3.1.5", Accept: "*/*" };

      const catRes = await fetch(
        `${cleanServer}/player_api.php?username=${cleanUser}&password=${cleanPass}&action=get_live_categories`,
        { headers },
      );
      const catData = catRes.ok ? await catRes.json() : [];

      const streamRes = await fetch(
        `${cleanServer}/player_api.php?username=${cleanUser}&password=${cleanPass}&action=get_live_streams`,
        { headers },
      );

      if (streamRes.ok) {
        const streamData = await streamRes.json();
        if (Array.isArray(streamData)) {
          const categoryMap: { [key: string]: string } = {};
          if (Array.isArray(catData)) {
            catData.forEach((c: any) => {
              categoryMap[c.category_id] = c.category_name;
            });
          }

          const enriched = streamData.map((item: any) => ({
            ...item,
            name: item.name
              ? item.name.replace(/^LIVE\s*[:|-]?\s*/i, "").trim()
              : item.name,
            category_name: categoryMap[item.category_id] || "Diğer",
          }));

          const parsed = parseXtreamChannels(
            enriched,
            cleanServer,
            cleanUser,
            cleanPass,
          );
          setAllChannels(parsed);
          setFilteredChannels(parsed);
          if (parsed.length > 0) setSelectedChannel(parsed[0]);

          const generatedCats: Category[] = [
            { category_id: "all", category_name: "🌐 TÜM KANALLAR" },
            { category_id: "favorites", category_name: "⭐ FAVORİLER" },
          ];
          if (Array.isArray(catData)) {
            catData.forEach((c: any) =>
              generatedCats.push({
                category_id: c.category_name,
                category_name: c.category_name,
              }),
            );
          }
          setCategories(generatedCats);
        }
      }
    } catch (error: any) {
      alert(`Hata: ${error?.message || "Canlı TV verileri alınamadı"}`);
    } finally {
      setLoading(false);
    }
  };

  // Filmler Sekmesine Girilince Çalışır
  const fetchMovieData = async () => {
    if (moviesLoaded || moviesLoading) return;
    try {
      setMoviesLoading(true);
      const cleanServer = cleanUrl(serverInput);
      const headers = { "User-Agent": "IPTVSmartersPro/3.1.5", Accept: "*/*" };

      const vCat = await fetch(
        `${cleanServer}/player_api.php?username=${userInput.trim()}&password=${passInput.trim()}&action=get_vod_categories`,
        { headers },
      );
      const vCatData = vCat.ok ? await vCat.json() : [];

      const vStreams = await fetch(
        `${cleanServer}/player_api.php?username=${userInput.trim()}&password=${passInput.trim()}&action=get_vod_streams`,
        { headers },
      );

      if (vStreams.ok) {
        const vData = await vStreams.json();
        if (Array.isArray(vData)) {
          setAllMovies(vData);
          setFilteredMovies(vData);
          const generated: Category[] = [
            { category_id: "all", category_name: "🎬 TÜM FİLMLER" },
          ];
          if (Array.isArray(vCatData)) {
            vCatData.forEach((c: any) =>
              generated.push({
                category_id: c.category_id,
                category_name: c.category_name,
              }),
            );
          }
          setMovieCategories(generated);
          setMoviesLoaded(true);
        }
      }
    } catch (e) {
      console.warn("Movies hatası:", e);
    } finally {
      setMoviesLoading(false);
    }
  };

  // Diziler Sekmesine Girilince Çalışır
  const fetchSeriesData = async () => {
    if (seriesLoaded || seriesLoading) return;
    try {
      setSeriesLoading(true);
      const cleanServer = cleanUrl(serverInput);
      const headers = { "User-Agent": "IPTVSmartersPro/3.1.5", Accept: "*/*" };

      const sCat = await fetch(
        `${cleanServer}/player_api.php?username=${userInput.trim()}&password=${passInput.trim()}&action=get_series_categories`,
        { headers },
      );
      const sCatData = sCat.ok ? await sCat.json() : [];

      const sRes = await fetch(
        `${cleanServer}/player_api.php?username=${userInput.trim()}&password=${passInput.trim()}&action=get_series`,
        { headers },
      );

      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) {
          setAllSeries(sData);
          setFilteredSeries(sData);
          const generated: Category[] = [
            { category_id: "all", category_name: "🍿 TÜM DİZİLER" },
          ];
          if (Array.isArray(sCatData)) {
            sCatData.forEach((c: any) =>
              generated.push({
                category_id: c.category_id,
                category_name: c.category_name,
              }),
            );
          }
          setSeriesCategories(generated);
          setSeriesLoaded(true);
        }
      }
    } catch (e) {
      console.warn("Series hatası:", e);
    } finally {
      setSeriesLoading(false);
    }
  };

  const fetchSeriesEpisodes = async (seriesId: number) => {
    try {
      setSeriesLoading(true);
      const cleanServer = cleanUrl(serverInput);

      const res = await fetch(
        `${cleanServer}/player_api.php?username=${userInput.trim()}&password=${passInput.trim()}&action=get_series_info&series_id=${seriesId}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.episodes) {
          setEpisodes(data.episodes);
          const seasons = Object.keys(data.episodes);
          if (seasons.length > 0) setSelectedSeason(seasons[0]);
        }
      }
    } catch (e) {
      alert("Bölümler yüklenemedi.");
    } finally {
      setSeriesLoading(false);
    }
  };

  const playMovie = (movie: VodItem) => {
    const cleanServer = cleanUrl(serverInput);
    const ext = movie.container_extension || "mp4";
    const url = `${cleanServer}/movie/${userInput.trim()}/${passInput.trim()}/${movie.stream_id}.${ext}`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
  };

  const playEpisode = (episode: Episode) => {
    const cleanServer = cleanUrl(serverInput);
    const ext = episode.container_extension || "mp4";
    const url = `${cleanServer}/series/${userInput.trim()}/${passInput.trim()}/${episode.id}.${ext}`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
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
        <Text style={styles.loadingText}>Yayınlar Yükleniyor...</Text>
      </View>
    );
  }

  // --- EKRAN 1: DASHBOARD ---
  if (currentScreen === "dashboard") {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.dashHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.dashTitle}>BİLO IPTV PLAYER</Text>
            <Text style={styles.dashSubtitle}> | Premium Edition</Text>
          </View>
          <View style={styles.dashHeaderRight}>
            <Text style={styles.userInfo}>👤 {userInput}</Text>
            <Pressable
              style={({ focused }: any) => [
                styles.settingsBtn,
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => setIsModalOpen(true)}
            >
              <Text style={styles.settingsBtnText}>⚙️ Ayarlar</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <Pressable
            style={({ focused }: any) => [
              styles.dashCard,
              styles.liveCard,
              focused && styles.dashCardFocused,
            ]}
            focusable={true}
            hasTVPreferredFocus={true}
            onPress={() => {
              setSearchQuery("");
              setCurrentScreen("live");
            }}
          >
            <Text style={styles.cardIcon}>📺</Text>
            <Text style={styles.cardTitle}>LIVE TV</Text>
            <Text style={styles.cardCount}>{allChannels.length} Kanal</Text>
          </Pressable>

          <Pressable
            style={({ focused }: any) => [
              styles.dashCard,
              styles.moviesCard,
              focused && styles.dashCardFocused,
            ]}
            focusable={true}
            onPress={() => {
              setSearchQuery("");
              setCurrentScreen("movies");
              fetchMovieData();
            }}
          >
            <Text style={styles.cardIcon}>🎬</Text>
            <Text style={styles.cardTitle}>MOVIES</Text>
            <Text style={styles.cardCount}>
              {moviesLoading ? "Yükleniyor..." : `${allMovies.length} Film`}
            </Text>
          </Pressable>

          <Pressable
            style={({ focused }: any) => [
              styles.dashCard,
              styles.seriesCard,
              focused && styles.dashCardFocused,
            ]}
            focusable={true}
            onPress={() => {
              setSearchQuery("");
              setCurrentScreen("series");
              fetchSeriesData();
            }}
          >
            <Text style={styles.cardIcon}>🍿</Text>
            <Text style={styles.cardTitle}>SERIES</Text>
            <Text style={styles.cardCount}>
              {seriesLoading && !seriesLoaded
                ? "Yükleniyor..."
                : `${allSeries.length} Dizi`}
            </Text>
          </Pressable>
        </View>

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

  // --- EKRAN 2: MOVIES EKRANI ---
  if (currentScreen === "movies") {
    return (
      <View style={styles.container}>
        <View style={styles.categoryContainer}>
          <View style={styles.headerRow}>
            <Pressable
              style={({ focused }: any) => [
                styles.backBtn,
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => {
                setSelectedMovie(null);
                setCurrentScreen("dashboard");
              }}
            >
              <Text style={styles.settingsBtnText}>⬅ Ana Menü</Text>
            </Pressable>
          </View>
          {moviesLoading ? (
            <ActivityIndicator
              size="small"
              color="#FFD700"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={movieCategories}
              keyExtractor={(item) => item.category_id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.categoryCard,
                    selectedMovieCatId === item.category_id &&
                      styles.selectedCategoryCard,
                    focusedId === `mcat_${item.category_id}` &&
                      styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`mcat_${item.category_id}`)}
                  onPress={() => setSelectedMovieCatId(item.category_id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedMovieCatId === item.category_id &&
                        styles.selectedCategoryText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.category_name}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        <View style={styles.channelContainer}>
          <Text style={styles.headerTitle}>
            Filmler ({filteredMovies.length})
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              focusedId === "m_search" && styles.focusedCard,
            ]}
            placeholder="🔍 Film Ara..."
            placeholderTextColor="#777"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setFocusedId("m_search")}
          />
          {moviesLoading ? (
            <ActivityIndicator
              size="large"
              color="#FFD700"
              style={{ marginTop: 40 }}
            />
          ) : (
            <FlatList
              data={filteredMovies}
              keyExtractor={(item) => item.stream_id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.movieGridCard,
                    focusedId === `mov_${item.stream_id}` && styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`mov_${item.stream_id}`)}
                  onPress={() => setSelectedMovie(item)}
                >
                  {item.stream_icon ? (
                    <Image
                      source={{ uri: item.stream_icon }}
                      style={styles.posterImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.posterImage, styles.noLogo]}>
                      <Text style={styles.noLogoText}>🎬</Text>
                    </View>
                  )}
                  <Text style={styles.movieGridTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        <View style={styles.playerContainer}>
          {selectedMovie ? (
            <View style={styles.movieDetailContainer}>
              {selectedMovie.stream_icon && (
                <Image
                  source={{ uri: selectedMovie.stream_icon }}
                  style={styles.detailPoster}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.detailTitle}>{selectedMovie.name}</Text>
              <Pressable
                style={({ focused }: any) => [
                  styles.playBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => playMovie(selectedMovie)}
              >
                <Text style={styles.playBtnText}>▶ Filmi Başlat</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Detay için film seçin</Text>
          )}
        </View>

        {isFullscreen && activeMediaUrl && (
          <View style={styles.fullPlayerContainer}>
            <Video
              source={{ uri: activeMediaUrl }}
              style={styles.fullVideo}
              controls={true}
              resizeMode="contain"
              onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
              onLoad={() => setIsVideoLoading(false)}
              onError={() => alert("Film açılırken hata oluştu.")}
            />
          </View>
        )}
      </View>
    );
  }

  // --- EKRAN 3: SERIES EKRANI ---
  if (currentScreen === "series") {
    return (
      <View style={styles.container}>
        <View style={styles.categoryContainer}>
          <View style={styles.headerRow}>
            <Pressable
              style={({ focused }: any) => [
                styles.backBtn,
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => {
                setSelectedSeries(null);
                setCurrentScreen("dashboard");
              }}
            >
              <Text style={styles.settingsBtnText}>⬅ Ana Menü</Text>
            </Pressable>
          </View>
          {seriesLoading && !seriesLoaded ? (
            <ActivityIndicator
              size="small"
              color="#FFD700"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={seriesCategories}
              keyExtractor={(item) => item.category_id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.categoryCard,
                    selectedSeriesCatId === item.category_id &&
                      styles.selectedCategoryCard,
                    focusedId === `scat_${item.category_id}` &&
                      styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`scat_${item.category_id}`)}
                  onPress={() => setSelectedSeriesCatId(item.category_id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedSeriesCatId === item.category_id &&
                        styles.selectedCategoryText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.category_name}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        {!selectedSeries ? (
          <View style={{ flex: 1, padding: 8 }}>
            <Text style={styles.headerTitle}>
              Diziler ({filteredSeries.length})
            </Text>
            <TextInput
              style={[
                styles.searchInput,
                focusedId === "s_search" && styles.focusedCard,
              ]}
              placeholder="🔍 Dizi Ara..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedId("s_search")}
            />
            {seriesLoading && !seriesLoaded ? (
              <ActivityIndicator
                size="large"
                color="#FFD700"
                style={{ marginTop: 40 }}
              />
            ) : (
              <FlatList
                data={filteredSeries}
                keyExtractor={(item) => item.series_id.toString()}
                numColumns={4}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.movieGridCard,
                      { width: "23%" },
                      focusedId === `ser_${item.series_id}` &&
                        styles.focusedCard,
                    ]}
                    focusable={true}
                    onFocus={() => setFocusedId(`ser_${item.series_id}`)}
                    onPress={() => {
                      setSelectedSeries(item);
                      fetchSeriesEpisodes(item.series_id);
                    }}
                  >
                    {item.cover ? (
                      <Image
                        source={{ uri: item.cover }}
                        style={styles.posterImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.posterImage, styles.noLogo]}>
                        <Text style={styles.noLogoText}>🍿</Text>
                      </View>
                    )}
                    <Text style={styles.movieGridTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: "row", padding: 8 }}>
            {/* Sezon ve Bölüm Seçim Ekranı */}
            <View style={{ width: "35%", paddingRight: 8 }}>
              <Pressable
                style={[styles.backBtn, { marginBottom: 10 }]}
                focusable={true}
                onPress={() => setSelectedSeries(null)}
              >
                <Text style={styles.settingsBtnText}>⬅ Dizi Listesine Dön</Text>
              </Pressable>
              <Text style={styles.detailTitle}>{selectedSeries.name}</Text>
              {seriesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFD700"
                  style={{ marginTop: 20 }}
                />
              ) : (
                <ScrollView style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: "#FFD700",
                      fontWeight: "bold",
                      marginBottom: 6,
                    }}
                  >
                    SEZONLAR:
                  </Text>
                  {Object.keys(episodes).map((seasonKey) => (
                    <Pressable
                      key={seasonKey}
                      style={[
                        styles.categoryCard,
                        selectedSeason === seasonKey &&
                          styles.selectedCategoryCard,
                      ]}
                      focusable={true}
                      onPress={() => setSelectedSeason(seasonKey)}
                    >
                      <Text style={{ color: "#FFF", fontSize: 12 }}>
                        Sezon {seasonKey}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Bölümler */}
            <View style={{ width: "65%", paddingLeft: 8 }}>
              <Text
                style={{
                  color: "#FFD700",
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                BÖLÜMLER:
              </Text>
              {selectedSeason && episodes[selectedSeason] ? (
                <FlatList
                  data={episodes[selectedSeason]}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ focused }: any) => [
                        styles.channelCard,
                        focused && styles.focusedCard,
                      ]}
                      focusable={true}
                      onPress={() => playEpisode(item)}
                    >
                      <Text style={{ color: "#FFF", fontSize: 13 }}>
                        ▶ Bölüm {item.episode_num}: {item.title}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : (
                <Text style={{ color: "#666" }}>Bölüm bulunamadı.</Text>
              )}
            </View>
          </View>
        )}

        {isFullscreen && activeMediaUrl && (
          <View style={styles.fullPlayerContainer}>
            <Video
              source={{ uri: activeMediaUrl }}
              style={styles.fullVideo}
              controls={true}
              resizeMode="contain"
              onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
              onLoad={() => setIsVideoLoading(false)}
              onError={() => alert("Bölüm oynatılamadı.")}
            />
          </View>
        )}
      </View>
    );
  }

  // --- EKRAN 4: CANLI TV EKRANI ---
  return (
    <View style={styles.container}>
      {!isFullscreen && (
        <>
          <View style={styles.categoryContainer}>
            <View style={styles.headerRow}>
              <Pressable
                style={({ focused }: any) => [
                  styles.backBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => setCurrentScreen("dashboard")}
              >
                <Text style={styles.settingsBtnText}>⬅ Ana Menü</Text>
              </Pressable>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.category_id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.categoryCard,
                    selectedCategoryId === item.category_id &&
                      styles.selectedCategoryCard,
                    focusedId === `cat_${item.category_id}` &&
                      styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`cat_${item.category_id}`)}
                  onPress={() => setSelectedCategoryId(item.category_id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategoryId === item.category_id &&
                        styles.selectedCategoryText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.category_name}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <View style={styles.channelContainer}>
            <Text style={styles.headerTitle}>
              Kanallar ({filteredChannels.length})
            </Text>
            <TextInput
              style={[
                styles.searchInput,
                focusedId === "live_search" && styles.focusedCard,
              ]}
              placeholder="🔍 Kanal Ara..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedId("live_search")}
            />
            <FlatList
              data={filteredChannels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.channelCard,
                    selectedChannel?.id === item.id &&
                      styles.selectedChannelCard,
                    focusedId === `chan_${item.id}` && styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`chan_${item.id}`)}
                  onPress={() => {
                    setSelectedChannel(item);
                    setVideoError(null);
                  }}
                >
                  {item.logo ? (
                    <Image
                      source={{ uri: item.logo }}
                      style={styles.channelLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.channelLogo, styles.noLogo]}>
                      <Text style={styles.noLogoText}>📺</Text>
                    </View>
                  )}
                  <Text style={styles.channelText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Pressable
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Text style={styles.favText}>
                      {favorites.includes(item.id) ? "★" : "☆"}
                    </Text>
                  </Pressable>
                </Pressable>
              )}
            />
          </View>
        </>
      )}

      {/* Oynatıcı Alanı */}
      <View
        style={[
          styles.playerContainer,
          isFullscreen && styles.fullPlayerContainer,
        ]}
      >
        {selectedChannel ? (
          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: selectedChannel.url }}
              style={styles.video}
              controls={isFullscreen}
              resizeMode="contain"
              onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
              onLoad={() => {
                setIsVideoLoading(false);
                setVideoError(null);
              }}
              onError={(e) => {
                console.log("Video Hatası:", e);
                setVideoError("Yayın açılamıyor veya format desteklenmiyor.");
                setIsVideoLoading(false);
              }}
            />
            {isVideoLoading && (
              <View style={styles.videoOverlay}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Yayın Yükleniyor...</Text>
              </View>
            )}
            {videoError && (
              <View style={styles.videoOverlay}>
                <Text style={styles.errorText}>{videoError}</Text>
              </View>
            )}
            {!isFullscreen && (
              <Pressable
                style={({ focused }: any) => [
                  styles.fullscreenBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => setIsFullscreen(true)}
              >
                <Text style={styles.fullscreenBtnText}>⛶ Tam Ekran</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Text style={styles.placeholderText}>Lütfen bir kanal seçin</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 10,
    fontSize: 16,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#0d0f12",
    padding: 20,
    justifyContent: "center",
  },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  dashTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },
  dashSubtitle: {
    color: "#888",
    fontSize: 14,
  },
  dashHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    color: "#FFF",
    marginRight: 15,
    fontSize: 14,
  },
  settingsBtn: {
    backgroundColor: "#222",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },
  settingsBtnText: {
    color: "#FFF",
    fontSize: 12,
  },
  backBtn: {
    backgroundColor: "#222",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dashCard: {
    flex: 1,
    height: 180,
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  liveCard: {
    backgroundColor: "#1e293b",
  },
  moviesCard: {
    backgroundColor: "#311b92",
  },
  seriesCard: {
    backgroundColor: "#880e4f",
  },
  dashCardFocused: {
    borderColor: "#FFD700",
    transform: [{ scale: 1.03 }],
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  cardCount: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 5,
  },
  categoryContainer: {
    width: "25%",
    borderRightWidth: 1,
    borderColor: "#222",
    padding: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryCard: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: "#1a1a1a",
  },
  selectedCategoryCard: {
    backgroundColor: "#333",
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
  },
  categoryText: {
    color: "#AAA",
    fontSize: 13,
  },
  selectedCategoryText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  channelContainer: {
    width: "35%",
    borderRightWidth: 1,
    borderColor: "#222",
    padding: 8,
  },
  headerTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#222",
    color: "#FFF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    fontSize: 13,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: "#1a1a1a",
  },
  selectedChannelCard: {
    backgroundColor: "#2a2a2a",
    borderColor: "#FFD700",
    borderWidth: 1,
  },
  channelLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
    borderRadius: 4,
  },
  noLogo: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  noLogoText: {
    fontSize: 14,
  },
  channelText: {
    color: "#FFF",
    fontSize: 13,
    flex: 1,
  },
  favBtn: {
    padding: 4,
  },
  favText: {
    color: "#FFD700",
    fontSize: 16,
  },
  playerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  fullPlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "#000",
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  fullVideo: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff5252",
    fontSize: 14,
    textAlign: "center",
  },
  placeholderText: {
    color: "#555",
    fontSize: 14,
  },
  fullscreenBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  fullscreenBtnText: {
    color: "#FFF",
    fontSize: 12,
  },
  focusedCard: {
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  focusedBtn: {
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  movieGridCard: {
    width: "48%",
    margin: "1%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },
  posterImage: {
    width: "100%",
    height: 120,
    borderRadius: 6,
  },
  movieGridTitle: {
    color: "#FFF",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  movieDetailContainer: {
    alignItems: "center",
    padding: 20,
  },
  detailPoster: {
    width: 150,
    height: 220,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  playBtn: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "40%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#FFF",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  saveBtn: {
    backgroundColor: "#FFD700",
  },
  cancelBtn: {
    backgroundColor: "#444",
  },
  btnText: {
    color: "#000",
    fontWeight: "bold",
  },
});
