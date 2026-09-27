import React, { memo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  ListRenderItemInfo,
  PressableStateCallbackType,
} from "react-native";
import Video from "react-native-video";
import { styles } from "../styles/appStyles";
import { Category, Channel } from "../utils/m3uParser";

interface LiveTvScreenProps {
  categories: Category[];
  allCountries: string[];
  selectedCountry: string;
  categoryTab?: "ALL" | "FAV";
  setCategoryTab?: (tab: "ALL" | "FAV") => void;
  favoriteCategoryIds?: string[];
  setSelectedCountry: (country: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  filteredChannels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favorites: string[];
  toggleFavoriteCategory: (categoryId: string) => void;
  toggleFavorite: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  isVideoLoading: boolean;
  setIsVideoLoading: (loading: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  onGoBack: () => void;
}

type CustomPressableState = PressableStateCallbackType & { focused?: boolean };

const CHANNEL_ITEM_HEIGHT = 60;

// Optimized ChannelItem
const ChannelItem = memo(
  ({
    item,
    isSelected,
    isFavorite,
    onFocus,
    onPress,
    onToggleFavorite,
  }: {
    item: Channel;
    isSelected: boolean;
    isFavorite: boolean;
    onFocus: () => void;
    onPress: () => void;
    onToggleFavorite: () => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: CHANNEL_ITEM_HEIGHT,
        marginBottom: 4,
      }}
    >
      <Pressable
        focusable={true}
        onFocus={onFocus}
        onPress={onPress}
        style={({ focused }: CustomPressableState) => [
          styles.channelCard,
          {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            height: "100%",
          },
          isSelected && styles.selectedChannelCard,
          focused && styles.focusedCard,
        ]}
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

        <Text
          style={[
            styles.channelName,
            isSelected && styles.selectedCategoryText,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </Pressable>

      <Pressable
        focusable={true}
        onPress={onToggleFavorite}
        style={({ focused }: CustomPressableState) => [
          styles.favBtn,
          { paddingHorizontal: 12, height: "100%", justifyContent: "center" },
          focused && { backgroundColor: "#FFD70033", borderRadius: 4 },
        ]}
      >
        <Text style={{ fontSize: 16, color: isFavorite ? "#FFD700" : "#888" }}>
          {isFavorite ? "⭐" : "☆"}
        </Text>
      </Pressable>
    </View>
  ),
);

export const LiveTvScreen: React.FC<LiveTvScreenProps> = ({
  categories,
  allCountries,
  selectedCountry,
  categoryTab = "ALL",
  setCategoryTab,
  favoriteCategoryIds = [],
  setSelectedCountry,
  selectedCategoryId,
  setSelectedCategoryId,
  filteredChannels,
  selectedChannel,
  setSelectedChannel,
  searchQuery,
  setSearchQuery,
  favorites,
  toggleFavoriteCategory,
  toggleFavorite,
  focusedId,
  setFocusedId,
  isVideoLoading,
  setIsVideoLoading,
  isFullscreen,
  setIsFullscreen,
  onGoBack,
}) => {
  // Kumanda Geri Tuşu
  useEffect(() => {
    const backAction = () => {
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
  }, [isFullscreen, setIsFullscreen]);

  useEffect(() => {
    if (selectedChannel) {
      setIsVideoLoading(true);
    }
  }, [selectedChannel?.url, setIsVideoLoading]);

  const displayCategories =
    categoryTab === "FAV"
      ? categories.filter((c) => favoriteCategoryIds.includes(c.category_id))
      : categories;

  const renderChannelItem = useCallback(
    ({ item }: ListRenderItemInfo<Channel>) => (
      <ChannelItem
        item={item}
        isSelected={selectedChannel?.id === item.id}
        isFavorite={favorites.includes(item.id)}
        onFocus={() => setFocusedId(`ch_${item.id}`)}
        onPress={() => setSelectedChannel(item)}
        onToggleFavorite={() => toggleFavorite(item.id)}
      />
    ),
    [
      selectedChannel?.id,
      favorites,
      setFocusedId,
      setSelectedChannel,
      toggleFavorite,
    ],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CHANNEL_ITEM_HEIGHT + 4,
      offset: (CHANNEL_ITEM_HEIGHT + 4) * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Sol Panel: Kategoriler */}
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

        {/* Sekme Butonları */}
        {setCategoryTab && (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            <Pressable
              style={({ focused }: CustomPressableState) => [
                {
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  borderRadius: 6,
                  backgroundColor: categoryTab === "ALL" ? "#FFD700" : "#222",
                  marginRight: 4,
                },
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => setCategoryTab("ALL")}
            >
              <Text
                style={{
                  color: categoryTab === "ALL" ? "#000" : "#FFF",
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                TÜMÜ
              </Text>
            </Pressable>

            <Pressable
              style={({ focused }: CustomPressableState) => [
                {
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  borderRadius: 6,
                  backgroundColor: categoryTab === "FAV" ? "#FFD700" : "#222",
                  marginLeft: 4,
                },
                focused && styles.focusedBtn,
              ]}
              focusable={true}
              onPress={() => setCategoryTab("FAV")}
            >
              <Text
                style={{
                  color: categoryTab === "FAV" ? "#000" : "#FFF",
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                ⭐ FAVORİLER
              </Text>
            </Pressable>
          </View>
        )}

        {/* Ülke Seçim Şeridi */}
        {allCountries.length > 1 && (
          <View
            style={{ maxHeight: 45, marginBottom: 8, paddingHorizontal: 4 }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allCountries.map((country) => (
                <Pressable
                  key={country}
                  style={({ focused }: CustomPressableState) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor:
                        selectedCountry === country ? "#FFD700" : "#222",
                      marginRight: 6,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                    focused && styles.focusedBtn,
                  ]}
                  focusable={true}
                  onPress={() => {
                    setSelectedCountry(country);
                    const firstMatch = categories.find((c) =>
                      country === "TÜMÜ"
                        ? true
                        : c.category_name.toUpperCase().startsWith(country),
                    );
                    if (firstMatch)
                      setSelectedCategoryId(firstMatch.category_id);
                  }}
                >
                  <Text
                    style={{
                      color: selectedCountry === country ? "#000" : "#FFF",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {country}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Kategori Listesi */}
        <FlatList
          data={displayCategories}
          keyExtractor={(item) => item.category_id}
          renderItem={({ item }) => {
            const isCatFav = favoriteCategoryIds.includes(item.category_id);
            const isSelected = selectedCategoryId === item.category_id;

            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Pressable
                  style={({ focused }: CustomPressableState) => [
                    styles.categoryCard,
                    { flex: 1 },
                    isSelected && styles.selectedCategoryCard,
                    focused && styles.focusedCard,
                  ]}
                  focusable={true}
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

                <Pressable
                  focusable={true}
                  onFocus={() => setFocusedId(`cat_fav_${item.category_id}`)}
                  onPress={() => toggleFavoriteCategory(item.category_id)}
                  style={({ focused }: CustomPressableState) => [
                    styles.favBtn,
                    { paddingHorizontal: 8 },
                    focused && {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 4,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{isCatFav ? "⭐" : "☆"}</Text>
                </Pressable>
              </View>
            );
          }}
        />
      </View>

      {/* Orta Panel: Kanal Listesi */}
      <View style={styles.channelContainer}>
        <Text style={styles.headerTitle}>
          Kanallar ({filteredChannels.length})
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            focusedId === "c_search" && styles.focusedCard,
          ]}
          placeholder="🔍 Kanal Ara..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setFocusedId("c_search")}
        />

        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={getItemLayout}
          renderItem={renderChannelItem}
        />
      </View>

      {/* Sağ Panel: Oynatıcı */}
      <View style={styles.playerContainer}>
        {selectedChannel ? (
          <View style={{ flex: 1, width: "100%" }}>
            {!isFullscreen && (
              <View style={styles.videoWrapper}>
                {isVideoLoading && (
                  <View style={styles.videoOverlay}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={{ color: "#FFF", marginTop: 8 }}>
                      Yükleniyor...
                    </Text>
                  </View>
                )}
                <Video
                  key={selectedChannel.url}
                  source={{
                    uri: selectedChannel.url,
                    headers: { "User-Agent": "IPTV-Player" },
                  }}
                  style={styles.videoPlayer}
                  controls={false}
                  resizeMode="contain"
                  bufferConfig={{
                    minBufferMs: 15000,
                    maxBufferMs: 50000,
                    bufferForPlaybackMs: 2500,
                    bufferForPlaybackAfterRebufferMs: 5000,
                  }}
                  automaticallyWaitsToMinimizeStalling={true}
                  onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
                  onLoad={() => setIsVideoLoading(false)}
                  onError={() => setIsVideoLoading(false)}
                />
              </View>
            )}

            <View style={styles.channelInfoContainer}>
              <Text style={styles.selectedChannelTitle}>
                {selectedChannel.name}
              </Text>
              <Pressable
                style={({ focused }: CustomPressableState) => [
                  styles.fullScreenBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => setIsFullscreen(true)}
              >
                <Text style={styles.fullScreenBtnText}>⛶ Tam Ekran Yap</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            İzlemek için bir kanal seçin
          </Text>
        )}
      </View>

      {/* Tam Ekran Modu */}
      {isFullscreen && selectedChannel && (
        <View style={styles.fullPlayerContainer}>
          <Video
            key={`full_${selectedChannel.url}`}
            source={{
              uri: selectedChannel.url,
              headers: { "User-Agent": "IPTV-Player" },
            }}
            style={styles.fullVideo}
            controls={true}
            resizeMode="contain"
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
            }}
            automaticallyWaitsToMinimizeStalling={true}
            onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
            onLoad={() => setIsVideoLoading(false)}
            onError={() => setIsVideoLoading(false)}
          />
        </View>
      )}
    </View>
  );
};
