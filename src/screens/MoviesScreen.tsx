import React, { memo, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  BackHandler,
  ListRenderItemInfo,
  PressableStateCallbackType,
} from "react-native";
import Video from "react-native-video";
import { styles } from "../styles/appStyles";
import { Category } from "../utils/m3uParser";

export interface VodItem {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  container_extension: string;
  rating?: string;
}

interface MoviesScreenProps {
  movieCategories: Category[];
  selectedMovieCatId: string;
  setSelectedMovieCatId: (id: string) => void;
  filteredMovies: VodItem[];
  selectedMovie: VodItem | null;
  setSelectedMovie: (movie: VodItem | null) => void;
  moviesLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  isFullscreen: boolean;
  setIsFullscreen?: (fullscreen: boolean) => void;
  activeMediaUrl: string | null;
  setIsVideoLoading: (loading: boolean) => void;
  onPlayMovie: (movie: VodItem) => void;
  onGoBack: () => void;
}

type CustomPressableState = PressableStateCallbackType & { focused?: boolean };

// Film kartı yüksekliği + dikey marjin
const MOVIE_CARD_HEIGHT = 190;

// Render optimizasyonu için memoize edilmiş Film Kartı
const MovieItem = memo(
  ({
    item,
    isFocusedProp,
    onFocus,
    onPress,
  }: {
    item: VodItem;
    isFocusedProp: boolean;
    onFocus: () => void;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ focused }: CustomPressableState) => [
        styles.movieGridCard,
        (focused || isFocusedProp) && styles.focusedCard,
      ]}
      focusable={true}
      onFocus={onFocus}
      onPress={onPress}
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
  ),
);

export const MoviesScreen: React.FC<MoviesScreenProps> = ({
  movieCategories,
  selectedMovieCatId,
  setSelectedMovieCatId,
  filteredMovies,
  selectedMovie,
  setSelectedMovie,
  moviesLoading,
  searchQuery,
  setSearchQuery,
  focusedId,
  setFocusedId,
  isFullscreen,
  setIsFullscreen,
  activeMediaUrl,
  setIsVideoLoading,
  onPlayMovie,
  onGoBack,
}) => {
  const movieListRef = useRef<FlatList>(null);

  // Kumanda Geri Tuşu Yönetimi
  useEffect(() => {
    const backAction = () => {
      if (isFullscreen && setIsFullscreen) {
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
  }, [isFullscreen, setIsFullscreen]);

  // Kategori veya Arama değiştiğinde Grid listesini başa sar
  useEffect(() => {
    if (filteredMovies.length > 0 && movieListRef.current) {
      movieListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedMovieCatId, searchQuery]);

  // Film Kartı Render Fonksiyonu
  const renderMovieItem = useCallback(
    ({ item }: ListRenderItemInfo<VodItem>) => (
      <MovieItem
        item={item}
        isFocusedProp={focusedId === `mov_${item.stream_id}`}
        onFocus={() => setFocusedId(`mov_${item.stream_id}`)}
        onPress={() => setSelectedMovie(item)}
      />
    ),
    [focusedId, setFocusedId, setSelectedMovie],
  );

  // 2 Kolonlu FlatList için getItemLayout Hesabı
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: MOVIE_CARD_HEIGHT,
      offset: MOVIE_CARD_HEIGHT * Math.floor(index / 2),
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Sol Panel: Film Kategorileri */}
      <View style={styles.categoryContainer}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ focused }: CustomPressableState) => [
              styles.backBtn,
              focused && styles.focusedBtn,
            ]}
            focusable={true}
            onPress={onGoBack}
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
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            ListEmptyComponent={
              <Text
                style={{
                  color: "#888",
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 12,
                }}
              >
                Kategori bulunamadı.
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selectedMovieCatId === item.category_id;
              return (
                <Pressable
                  style={({ focused }: CustomPressableState) => [
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard,
                    (focused || focusedId === `mcat_${item.category_id}`) &&
                      styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`mcat_${item.category_id}`)}
                  onPress={() => setSelectedMovieCatId(item.category_id)}
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
        )}
      </View>

      {/* Orta Panel: Film Grid Listesi */}
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
            ref={movieListRef}
            data={filteredMovies}
            keyExtractor={(item) => item.stream_id.toString()}
            numColumns={2}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
            renderItem={renderMovieItem}
            ListEmptyComponent={
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 40 }}
              >
                Film bulunamadı.
              </Text>
            }
          />
        )}
      </View>

      {/* Sağ Panel: Film Detay Paneli */}
      <View style={styles.playerContainer}>
        {selectedMovie ? (
          <View style={styles.movieDetailContainer}>
            {selectedMovie.stream_icon ? (
              <Image
                source={{ uri: selectedMovie.stream_icon }}
                style={styles.detailPoster}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.detailPoster, styles.noLogo]}>
                <Text style={{ fontSize: 40 }}>🎬</Text>
              </View>
            )}

            <Text style={styles.detailTitle}>{selectedMovie.name}</Text>

            <Pressable
              style={({ focused }: CustomPressableState) => [
                styles.playBtn,
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => onPlayMovie(selectedMovie)}
            >
              <Text style={styles.playBtnText}>▶ Filmi Başlat</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Detay için film seçin</Text>
        )}
      </View>

      {/* Tam Ekran Oynatıcı */}
      {isFullscreen && activeMediaUrl && (
        <View style={styles.fullPlayerContainer}>
          <Video
            source={{ uri: activeMediaUrl }}
            style={styles.fullVideo}
            controls={true}
            resizeMode="contain"
            onBuffer={({ isBuffering }: { isBuffering: boolean }) =>
              setIsVideoLoading(isBuffering)
            }
            onLoad={() => setIsVideoLoading(false)}
            onError={() => alert("Film açılırken hata oluştu.")}
          />
        </View>
      )}
    </View>
  );
};
