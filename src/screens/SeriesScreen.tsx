import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
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
  activeMediaUrl: string | null;
  setIsVideoLoading: (loading: boolean) => void;
  onFetchSeriesEpisodes: (seriesId: number) => void;
  onPlayEpisode: (episode: Episode) => void;
  onGoBack: () => void;
}

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
  activeMediaUrl,
  setIsVideoLoading,
  onFetchSeriesEpisodes,
  onPlayEpisode,
  onGoBack,
}) => {
  return (
    <View style={styles.container}>
      {/* Sol Kategori Paneli */}
      <View style={styles.categoryContainer}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ focused }: any) => [
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
              data={filteredSeries}
              keyExtractor={(item) => item.series_id.toString()}
              numColumns={4}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.movieGridCard,
                    { width: "23%" },
                    focusedId === `ser_${item.series_id}` && styles.focusedCard,
                  ]}
                  focusable={true}
                  onFocus={() => setFocusedId(`ser_${item.series_id}`)}
                  onPress={() => {
                    setSelectedSeries(item);
                    onFetchSeriesEpisodes(item.series_id);
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
          {/* Sezon Seçimi */}
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

          {/* Bölümler Listesi */}
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
                renderItem={({ item }) => (
                  <Pressable
                    style={({ focused }: any) => [
                      styles.episodeCard,
                      focused && styles.focusedCard,
                    ]}
                    focusable={true}
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
              <Text style={{ color: "#AAA" }}>Bölüm bulunamadı.</Text>
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
