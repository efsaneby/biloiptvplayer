import React, { memo, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  ListRenderItemInfo,
  PressableStateCallbackType,
} from "react-native";
import Video from "react-native-video";
import { styles } from "../styles/appStyles";
import { Category } from "../utils/m3uParser";

export interface SeriesItem {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
  plot?: string;
  rating?: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
}

interface SeriesScreenProps {
  seriesCategories: Category[];
  selectedSeriesCatId: string;
  setSelectedSeriesCatId: (id: string) => void;
  filteredSeries: SeriesItem[];
  selectedSeries: SeriesItem | null;
  setSelectedSeries: (series: SeriesItem | null) => void;
  episodes: { [season: string]: Episode[] };
  selectedSeason: string | null;
  setSelectedSeason: (season: string) => void;
  seriesLoading: boolean;
  seriesLoaded: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  isFullscreen: boolean;
  setIsFullscreen?: (fullscreen: boolean) => void;
  activeMediaUrl: string | null;
  setIsVideoLoading: (loading: boolean) => void;
  onFetchSeriesEpisodes: (seriesId: number) => void;
  onPlayEpisode: (episode: Episode) => void;
  onGoBack: () => void;
}

type CustomPressableState = PressableStateCallbackType & { focused?: boolean };

const SERIES_CARD_HEIGHT = 180;

// Performans için memoize edilmiş Dizi Kartı
const SeriesItemCard = memo(
  ({
    item,
    isFocusedProp,
    onFocus,
    onPress,
  }: {
    item: SeriesItem;
    isFocusedProp: boolean;
    onFocus: () => void;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ focused }: CustomPressableState) => [
        styles.movieGridCard,
        { flex: 1, margin: 4 },
        (focused || isFocusedProp) && styles.focusedCard,
      ]}
      focusable={true}
      onFocus={onFocus}
      onPress={onPress}
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
  ),
);

export const SeriesScreen: React.FC<SeriesScreenProps> = ({
  seriesCategories,
  selectedSeriesCatId,
  setSelectedSeriesCatId,
  filteredSeries,
  selectedSeries,
  setSelectedSeries,
  episodes,
  selectedSeason,
  setSelectedSeason,
  seriesLoading,
  seriesLoaded,
  searchQuery,
  setSearchQuery,
  focusedId,
  setFocusedId,
  isFullscreen,
  setIsFullscreen,
  activeMediaUrl,
  setIsVideoLoading,
  onFetchSeriesEpisodes,
  onPlayEpisode,
  onGoBack,
}) => {
  const seriesListRef = useRef<FlatList>(null);

  // Kumanda Geri Tuşu Yönetimi
  useEffect(() => {
    const backAction = () => {
      if (isFullscreen && setIsFullscreen) {
        setIsFullscreen(false);
        return true;
      }
      if (selectedSeries) {
        setSelectedSeries(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [isFullscreen, setIsFullscreen, selectedSeries, setSelectedSeries]);

  // Kategori veya Arama değiştiğinde Grid listesini başa sar
  useEffect(() => {
    if (filteredSeries.length > 0 && seriesListRef.current) {
      seriesListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedSeriesCatId, searchQuery]);

  // Dizi Detayına girildiğinde ilk sezonu otomatik seç
  useEffect(() => {
    if (selectedSeries && episodes) {
      const seasonKeys = Object.keys(episodes);
      if (
        seasonKeys.length > 0 &&
        (!selectedSeason || !episodes[selectedSeason])
      ) {
        setSelectedSeason(seasonKeys[0]);
      }
    }
  }, [selectedSeries, episodes, selectedSeason, setSelectedSeason]);

  // Dizi Kartı Render Fonksiyonu
  const renderSeriesItem = useCallback(
    ({ item }: ListRenderItemInfo<SeriesItem>) => (
      <SeriesItemCard
        item={item}
        isFocusedProp={focusedId === `ser_${item.series_id}`}
        onFocus={() => setFocusedId(`ser_${item.series_id}`)}
        onPress={() => {
          setSelectedSeries(item);
          onFetchSeriesEpisodes(item.series_id);
        }}
      />
    ),
    [focusedId, setFocusedId, setSelectedSeries, onFetchSeriesEpisodes],
  );

  // FlatList 4 sütunlu grid hesaplaması
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SERIES_CARD_HEIGHT,
      offset: SERIES_CARD_HEIGHT * Math.floor(index / 4),
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Sol Kategori Paneli */}
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
              const isSelected = selectedSeriesCatId === item.category_id;
              return (
                <Pressable
                  style={({ focused }: CustomPressableState) => [
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard,
                    (focused || focusedId === `scat_${item.category_id}`) &&
                      styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`scat_${item.category_id}`)}
                  onPress={() => setSelectedSeriesCatId(item.category_id)}
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

      {/* Dizi Seçimi / Detay Paneli */}
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
              ref={seriesListRef}
              data={filteredSeries}
              keyExtractor={(item) => item.series_id.toString()}
              numColumns={4}
              initialNumToRender={12}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              windowSize={5}
              removeClippedSubviews={true}
              getItemLayout={getItemLayout}
              renderItem={renderSeriesItem}
              ListEmptyComponent={
                <Text
                  style={{ color: "#888", textAlign: "center", marginTop: 40 }}
                >
                  Dizi bulunamadı.
                </Text>
              }
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: "row", padding: 8 }}>
          {/* Sezon Seçimi Paneli */}
          <View style={{ width: "35%", paddingRight: 8 }}>
            <Pressable
              style={({ focused }: CustomPressableState) => [
                styles.backBtn,
                { marginBottom: 10 },
                focused && styles.focusedBtn,
              ]}
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
                {Object.keys(episodes).map((seasonKey) => {
                  const isSelectedSeason = selectedSeason === seasonKey;
                  return (
                    <Pressable
                      key={seasonKey}
                      style={({ focused }: CustomPressableState) => [
                        styles.categoryCard,
                        isSelectedSeason && styles.selectedCategoryCard,
                        (focused || focusedId === `season_${seasonKey}`) &&
                          styles.focusedCard,
                      ]}
                      focusable={true}
                      onFocus={() => setFocusedId(`season_${seasonKey}`)}
                      onPress={() => setSelectedSeason(seasonKey)}
                    >
                      <Text
                        style={[
                          { color: "#FFF", fontSize: 12 },
                          isSelectedSeason && {
                            fontWeight: "bold",
                            color: "#FFD700",
                          },
                        ]}
                      >
                        Sezon {seasonKey}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Bölümler Listesi Paneli */}
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
                keyExtractor={(ep) => ep.id.toString()}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ focused }: CustomPressableState) => [
                      styles.episodeCard,
                      (focused || focusedId === `ep_${item.id}`) &&
                        styles.focusedCard,
                    ]}
                    focusable={true}
                    onFocus={() => setFocusedId(`ep_${item.id}`)}
                    onPress={() => onPlayEpisode(item)}
                  >
                    <Text style={{ color: "#FFF", fontSize: 13 }}>
                      {item.episode_num}.{" "}
                      {item.title || `Bölüm ${item.episode_num}`}
                    </Text>
                  </Pressable>
                )}
              />
            ) : (
              <Text style={{ color: "#AAA" }}>
                {seriesLoading ? "Bölümler yükleniyor..." : "Bölüm bulunamadı."}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Tam Ekran Dizi Oynatıcı */}
      {isFullscreen && activeMediaUrl && (
        <View style={styles.fullPlayerContainer}>
          <Video
            source={{ uri: activeMediaUrl }}
            style={styles.fullVideo}
            controls={true}
            resizeMode="contain"
            onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
            onLoad={() => setIsVideoLoading(false)}
            onError={() => alert("Bölüm açılırken hata oluştu.")}
          />
        </View>
      )}
    </View>
  );
};
