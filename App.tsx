import React, { useState, useEffect, useMemo } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Ekran Bileşenleri
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LiveTvScreen } from "./src/screens/LiveTvScreen";
import { MoviesScreen, VodItem } from "./src/screens/MoviesScreen";
import { SeriesScreen, SeriesItem, Episode } from "./src/screens/SeriesScreen";

// Yardımcılar & Stiller
import { styles } from "./src/styles/appStyles";
import {
  Category,
  Channel,
  fetchCategories,
  fetchChannels,
  fetchVodCategories,
  fetchVodStreams,
  fetchSeriesCategories,
  fetchSeries,
  fetchSeriesInfo,
  fetchUserInfo,
} from "./src/utils/m3uParser";

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<
    "dash" | "live" | "movies" | "series"
  >("dash");

  // Credentials State
  const [serverInput, setServerInput] = useState("http://example.com:8080");
  const [userInput, setUserInput] = useState("demo");
  const [passInput, setPassInput] = useState("demo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expDate, setExpDate] = useState<string | null>(null);

  // Common UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Live TV State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // FAVORİ KATEGORİLER & TAB STATE'LERİ
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<string[]>([]);
  const [categoryTab, setCategoryTab] = useState<"ALL" | "FAV">("ALL");

  // Movies State
  const [movieCategories, setMovieCategories] = useState<Category[]>([]);
  const [selectedMovieCatId, setSelectedMovieCatId] = useState<string>("");
  const [movies, setMovies] = useState<VodItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<VodItem | null>(null);
  const [moviesLoading, setMoviesLoading] = useState(false);

  // Series State
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [selectedSeriesCatId, setSelectedSeriesCatId] = useState<string>("");
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [episodes, setEpisodes] = useState<{ [season: string]: Episode[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesLoaded, setSeriesLoaded] = useState(false);

  // Initial Load
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await loadFavoriteCategories();
      await loadFavoriteChannels();
      await loadSavedCredentials(isMounted);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filmler ekranına girildiğinde veri yoksa otomatik çek
  useEffect(() => {
    if (currentScreen === "movies" && movies.length === 0 && !moviesLoading) {
      handleFetchMovies();
    }
  }, [currentScreen, movies.length, moviesLoading]);

  const loadSavedCredentials = async (isMounted = true) => {
    try {
      const s = await AsyncStorage.getItem("@iptv_server");
      const u = await AsyncStorage.getItem("@iptv_user");
      const p = await AsyncStorage.getItem("@iptv_pass");

      if (isMounted) {
        if (s) setServerInput(s);
        if (u) setUserInput(u);
        if (p) setPassInput(p);
      }

      if (s && u && p) {
        loadLiveTvData(s, u, p, isMounted);
      }
    } catch (e) {
      console.error("Giriş bilgileri okunamadı:", e);
    }
  };

  // FAVORİ KATEGORİLERİ OKU & KAYDET
  const loadFavoriteCategories = async () => {
    try {
      const saved = await AsyncStorage.getItem("@fav_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavoriteCategoryIds(parsed);
        }
      }
    } catch (e) {
      console.error("Favori kategoriler yüklenemedi:", e);
    }
  };

  const toggleFavoriteCategory = async (catId: string) => {
    try {
      const updated = favoriteCategoryIds.includes(catId)
        ? favoriteCategoryIds.filter((id) => id !== catId)
        : [...favoriteCategoryIds, catId];

      setFavoriteCategoryIds(updated);
      await AsyncStorage.setItem("@fav_categories", JSON.stringify(updated));
    } catch (e) {
      console.error("Favori kategori kaydedilemedi:", e);
    }
  };

  // FAVORİ KANALLARI OKU & KAYDET
  const loadFavoriteChannels = async () => {
    try {
      const saved = await AsyncStorage.getItem("@fav_channels");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.error("Favori kanallar yüklenemedi:", e);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const updated = favorites.includes(id)
        ? favorites.filter((item) => item !== id)
        : [...favorites, id];

      setFavorites(updated);
      await AsyncStorage.setItem("@fav_channels", JSON.stringify(updated));
    } catch (e) {
      console.error("Favori kanal kaydedilemedi:", e);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      await AsyncStorage.setItem("@iptv_server", serverInput);
      await AsyncStorage.setItem("@iptv_user", userInput);
      await AsyncStorage.setItem("@iptv_pass", passInput);
      setIsModalOpen(false);
      loadLiveTvData(serverInput, userInput, passInput);
    } catch (e) {
      console.error("Bilgiler kaydedilemedi:", e);
    }
  };

  // Live TV Loader
  const loadLiveTvData = async (
    s: string,
    u: string,
    p: string,
    isMounted = true,
  ) => {
    try {
      const userInfo = await fetchUserInfo(s, u, p);
      if (isMounted) {
        if (userInfo && userInfo.exp_date) {
          const timeInMs = parseInt(userInfo.exp_date, 10) * 1000;
          if (!isNaN(timeInMs)) {
            const formattedDate = new Date(timeInMs).toLocaleDateString(
              "tr-TR",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              },
            );
            setExpDate(formattedDate);
          } else {
            setExpDate("Sınırsız / Belirsiz");
          }
        } else {
          setExpDate("Sınırsız");
        }
      }

      const cats = await fetchCategories(s, u, p);
      const chs = await fetchChannels(s, u, p);

      if (isMounted) {
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategoryId(cats[0].category_id);
        }
        setChannels(chs);
      }
    } catch (e) {
      console.error("Canlı TV verileri yüklenirken hata oluştu:", e);
    }
  };

  // FİLTRELENMİŞ KATEGORİLER (TÜMÜ VEYA SADECE FAVORİ YILDIZLI OLANLAR)
  const filteredCategories = useMemo(() => {
    if (categoryTab === "FAV") {
      // Sadece favoriye eklenmiş kategorileri göster
      return categories.filter((cat) =>
        favoriteCategoryIds.includes(cat.category_id),
      );
    }
    return categories;
  }, [categories, categoryTab, favoriteCategoryIds]);

  // Tab veya Filtre değiştiğinde aktif seçili kategoriyi güncelle
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const exists = filteredCategories.some(
        (c) => c.category_id === selectedCategoryId,
      );
      if (!exists) {
        setSelectedCategoryId(filteredCategories[0].category_id);
      }
    } else {
      setSelectedCategoryId("");
    }
  }, [filteredCategories, selectedCategoryId]);

  // Movies Loader
  const handleFetchMovies = async () => {
    if (movies.length > 0 || moviesLoading) return;
    setMoviesLoading(true);
    try {
      const mCats = await fetchVodCategories(serverInput, userInput, passInput);
      setMovieCategories(mCats);
      if (mCats.length > 0) setSelectedMovieCatId(mCats[0].category_id);

      const mList = await fetchVodStreams(serverInput, userInput, passInput);
      setMovies(mList);
    } catch (e) {
      console.error("Filmler yüklenirken hata oluştu:", e);
    } finally {
      setMoviesLoading(false);
    }
  };

  // Series Loader
  const handleFetchSeries = async () => {
    if (seriesLoaded || seriesLoading) return;
    setSeriesLoading(true);
    try {
      const sCats = await fetchSeriesCategories(
        serverInput,
        userInput,
        passInput,
      );
      setSeriesCategories(sCats);
      if (sCats.length > 0) setSelectedSeriesCatId(sCats[0].category_id);

      const sList = await fetchSeries(serverInput, userInput, passInput);
      setSeriesList(sList);
      setSeriesLoaded(true);
    } catch (e) {
      console.error("Diziler yüklenirken hata oluştu:", e);
    } finally {
      setSeriesLoading(false);
    }
  };

  const handleFetchSeriesEpisodes = async (seriesId: number) => {
    setSeriesLoading(true);
    try {
      const eps = await fetchSeriesInfo(
        serverInput,
        userInput,
        passInput,
        seriesId,
      );
      setEpisodes(eps);
      const seasonKeys = Object.keys(eps);
      if (seasonKeys.length > 0) setSelectedSeason(seasonKeys[0]);
    } catch (e) {
      console.error("Bölümler yüklenirken hata oluştu:", e);
    } finally {
      setSeriesLoading(false);
    }
  };

  const handlePlayMovie = (movie: VodItem) => {
    const url = `${serverInput}/movie/${userInput}/${passInput}/${movie.stream_id}.${
      movie.container_extension || "mp4"
    }`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
  };

  const handlePlayEpisode = (episode: Episode) => {
    const url = `${serverInput}/series/${userInput}/${passInput}/${episode.id}.${
      episode.container_extension || "mp4"
    }`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
  };

  // FİLTRELENMİŞ KANALLAR (Kategori, Arama ve FAV Tab Desteği ile)
  const filteredChannels = useMemo(() => {
    if (categoryTab === "FAV") {
      // FAVORİLER Sekmesi: Hem tekil favori kanalları HEM DE favori kategorilerin kanallarını getir
      return channels.filter(
        (ch) =>
          favorites.includes(ch.id) ||
          favoriteCategoryIds.includes(ch.category_id),
      );
    }

    // ALL Sekmesi: Seçili kategoriye göre getir
    if (!selectedCategoryId) return channels;
    return channels.filter((ch) => ch.category_id === selectedCategoryId);
  }, [
    channels,
    categoryTab,
    selectedCategoryId,
    favorites,
    favoriteCategoryIds,
  ]);

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchCat = selectedMovieCatId
        ? m.category_id === selectedMovieCatId
        : true;
      const matchSearch = m.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [movies, selectedMovieCatId, searchQuery]);

  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      const matchCat = selectedSeriesCatId
        ? s.category_id === selectedSeriesCatId
        : true;
      const matchSearch = s.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [seriesList, selectedSeriesCatId, searchQuery]);

  return (
    <View style={styles.container}>
      {currentScreen === "dash" && (
        <DashboardScreen
          userInput={userInput}
          expDate={expDate}
          allChannelsCount={channels.length}
          allMoviesCount={movies.length}
          allSeriesCount={seriesList.length}
          moviesLoading={moviesLoading}
          seriesLoading={seriesLoading}
          seriesLoaded={seriesLoaded}
          isModalOpen={isModalOpen}
          serverInput={serverInput}
          passInput={passInput}
          categoryTab={categoryTab}
          setCategoryTab={setCategoryTab}
          setServerInput={setServerInput}
          setUserInput={setUserInput}
          setPassInput={setPassInput}
          setIsModalOpen={setIsModalOpen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onSaveCredentials={handleSaveCredentials}
          onFetchMovies={handleFetchMovies}
          onFetchSeries={handleFetchSeries}
          setSearchQuery={setSearchQuery}
        />
      )}

      {currentScreen === "live" && (
        <LiveTvScreen
          categories={filteredCategories}
          categoryTab={categoryTab}
          setCategoryTab={setCategoryTab}
          favoriteCategoryIds={favoriteCategoryIds}
          toggleFavoriteCategory={toggleFavoriteCategory}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          filteredChannels={filteredChannels}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          isVideoLoading={isVideoLoading}
          setIsVideoLoading={setIsVideoLoading}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          onGoBack={() => setCurrentScreen("dash")}
          allCountries={[]}
          selectedCountry={""}
          setSelectedCountry={() => {}}
        />
      )}

      {currentScreen === "movies" && (
        <MoviesScreen
          movieCategories={movieCategories}
          selectedMovieCatId={selectedMovieCatId}
          setSelectedMovieCatId={setSelectedMovieCatId}
          filteredMovies={filteredMovies}
          selectedMovie={selectedMovie}
          setSelectedMovie={setSelectedMovie}
          moviesLoading={moviesLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          isFullscreen={isFullscreen}
          activeMediaUrl={activeMediaUrl}
          setIsVideoLoading={setIsVideoLoading}
          onPlayMovie={handlePlayMovie}
          onGoBack={() => setCurrentScreen("dash")}
        />
      )}

      {currentScreen === "series" && (
        <SeriesScreen
          seriesCategories={seriesCategories}
          selectedSeriesCatId={selectedSeriesCatId}
          setSelectedSeriesCatId={setSelectedSeriesCatId}
          filteredSeries={filteredSeries}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
          episodes={episodes}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          seriesLoading={seriesLoading}
          seriesLoaded={seriesLoaded}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          isFullscreen={isFullscreen}
          activeMediaUrl={activeMediaUrl}
          setIsVideoLoading={setIsVideoLoading}
          onFetchSeriesEpisodes={handleFetchSeriesEpisodes}
          onPlayEpisode={handlePlayEpisode}
          onGoBack={() => setCurrentScreen("dash")}
        />
      )}
    </View>
  );
}
