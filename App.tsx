import React, { useState, useEffect } from "react";
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
    loadSavedCredentials();
  }, []);

  // Filmler ekranına girildiğinde veri yoksa otomatik çek
  useEffect(() => {
    if (currentScreen === "movies" && movies.length === 0 && !moviesLoading) {
      handleFetchMovies();
    }
  }, [currentScreen]);

  const loadSavedCredentials = async () => {
    try {
      const s = await AsyncStorage.getItem("@iptv_server");
      const u = await AsyncStorage.getItem("@iptv_user");
      const p = await AsyncStorage.getItem("@iptv_pass");

      if (s) setServerInput(s);
      if (u) setUserInput(u);
      if (p) setPassInput(p);

      if (s && u && p) {
        loadLiveTvData(s, u, p);
      }
    } catch (e) {
      console.error("Giriş bilgileri okunamadı:", e);
    }
  };

  const handleSaveCredentials = async () => {
    await AsyncStorage.setItem("@iptv_server", serverInput);
    await AsyncStorage.setItem("@iptv_user", userInput);
    await AsyncStorage.setItem("@iptv_pass", passInput);
    setIsModalOpen(false);
    loadLiveTvData(serverInput, userInput, passInput);
  };

  // Live TV Loader
  const loadLiveTvData = async (s: string, u: string, p: string) => {
    const userInfo = await fetchUserInfo(s, u, p);
    if (userInfo && userInfo.exp_date) {
      const timeInMs = parseInt(userInfo.exp_date, 10) * 1000;
      if (!isNaN(timeInMs)) {
        const formattedDate = new Date(timeInMs).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        setExpDate(formattedDate);
      } else {
        setExpDate("Sınırsız / Belirsiz");
      }
    } else {
      setExpDate("Sınırsız");
    }

    const cats = await fetchCategories(s, u, p);
    setCategories(cats);
    if (cats.length > 0) {
      setSelectedCategoryId(cats[0].category_id);
    }
    const chs = await fetchChannels(s, u, p);
    setChannels(chs);
  };

  // Movies Loader
  const handleFetchMovies = async () => {
    if (movies.length > 0) return;
    setMoviesLoading(true);
    const mCats = await fetchVodCategories(serverInput, userInput, passInput);
    setMovieCategories(mCats);
    if (mCats.length > 0) setSelectedMovieCatId(mCats[0].category_id);

    const mList = await fetchVodStreams(serverInput, userInput, passInput);
    setMovies(mList);
    setMoviesLoading(false);
  };

  // Series Loader
  const handleFetchSeries = async () => {
    if (seriesLoaded) return;
    setSeriesLoading(true);
    const sCats = await fetchSeriesCategories(
      serverInput,
      userInput,
      passInput,
    );
    setSeriesCategories(sCats);
    if (sCats.length > 0) setSelectedSeriesCatId(sCats[0].category_id);

    const sList = await fetchSeries(serverInput, userInput, passInput);
    setSeriesList(sList);
    setSeriesLoading(false);
    setSeriesLoaded(true);
  };

  const handleFetchSeriesEpisodes = async (seriesId: number) => {
    setSeriesLoading(true);
    const eps = await fetchSeriesInfo(
      serverInput,
      userInput,
      passInput,
      seriesId,
    );
    setEpisodes(eps);
    const seasonKeys = Object.keys(eps);
    if (seasonKeys.length > 0) setSelectedSeason(seasonKeys[0]);
    setSeriesLoading(false);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handlePlayMovie = (movie: VodItem) => {
    const url = `${serverInput}/movie/${userInput}/${passInput}/${movie.stream_id}.${movie.container_extension || "mp4"}`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
  };

  const handlePlayEpisode = (episode: Episode) => {
    const url = `${serverInput}/series/${userInput}/${passInput}/${episode.id}.${episode.container_extension || "mp4"}`;
    setActiveMediaUrl(url);
    setIsFullscreen(true);
  };

  const filteredChannels = channels.filter((c) => {
    const matchCat = selectedCategoryId
      ? c.category_id === selectedCategoryId
      : true;
    const matchSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredMovies = movies.filter((m) => {
    const matchCat = selectedMovieCatId
      ? m.category_id === selectedMovieCatId
      : true;
    const matchSearch = m.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredSeries = seriesList.filter((s) => {
    const matchCat = selectedSeriesCatId
      ? s.category_id === selectedSeriesCatId
      : true;
    const matchSearch = s.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
          categories={categories}
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
