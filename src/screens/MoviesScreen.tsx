import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
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
  activeMediaUrl: string | null;
  setIsVideoLoading: (loading: boolean) => void;
  onPlayMovie: (movie: VodItem) => void;
  onGoBack: () => void;
}

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
  activeMediaUrl,
  setIsVideoLoading,
  onPlayMovie,
  onGoBack,
}) => {
  return (
    <View style={styles.container}>
      {/* Film Kategorileri */}
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

      {/* Film Grid Listesi */}
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

      {/* Film Detay Paneli */}
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
              onPress={() => onPlayMovie(selectedMovie)}
            >
              <Text style={styles.playBtnText}>▶ Filmi Başlat</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Detay için film seçin</Text>
        )}
      </View>

      {/* Tam Ekran Film Oynatıcı */}
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
};
