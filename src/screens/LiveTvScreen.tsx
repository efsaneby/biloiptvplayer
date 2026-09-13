import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import Video from "react-native-video";
import { Category, Channel } from "../utils/m3uParser";

interface LiveTvScreenProps {
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  filteredChannels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  isVideoLoading: boolean;
  setIsVideoLoading: (loading: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  onGoBack: () => void;
}

export const LiveTvScreen: React.FC<LiveTvScreenProps> = ({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  filteredChannels,
  selectedChannel,
  setSelectedChannel,
  favorites,
  toggleFavorite,
  isVideoLoading,
  setIsVideoLoading,
  onGoBack,
}) => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* ÜST BAR / GERİ BUTONU */}
      <View
        style={{
          height: 60,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 15,
          backgroundColor: "#1e1e1e",
          borderBottomWidth: 1,
          borderBottomColor: "#333",
        }}
      >
        <Pressable
          style={{
            padding: 10,
            backgroundColor: "#333",
            borderRadius: 8,
          }}
          focusable={true}
          onPress={onGoBack}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>⬅ Ana Ekran</Text>
        </Pressable>
        <Text
          style={{
            color: "#FFD700",
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 20,
          }}
        >
          CANLI TV
        </Text>
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* SOL: KATEGORİ LİSTESİ */}
        <View
          style={{
            width: 250,
            backgroundColor: "#181818",
            borderRightWidth: 1,
            borderRightColor: "#333",
          }}
        >
          <FlatList
            data={categories}
            keyExtractor={(item) => item.category_id}
            renderItem={({ item }) => {
              const isSelected = item.category_id === selectedCategoryId;
              return (
                <Pressable
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#222",
                    backgroundColor: isSelected ? "#333" : "transparent",
                  }}
                  focusable={true}
                  onPress={() => setSelectedCategoryId(item.category_id)}
                >
                  <Text
                    style={{
                      color: isSelected ? "#FFD700" : "#fff",
                      fontSize: 14,
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                    numberOfLines={1}
                  >
                    {item.category_name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* ORTA: KANAL LİSTESİ */}
        <View
          style={{
            width: 300,
            backgroundColor: "#151515",
            borderRightWidth: 1,
            borderRightColor: "#333",
          }}
        >
          <FlatList
            data={filteredChannels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedChannel?.id === item.id;
              const isFav = favorites.includes(item.id);

              return (
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#222",
                    backgroundColor: isSelected ? "#2a2a2a" : "transparent",
                  }}
                  focusable={true}
                  onPress={() => setSelectedChannel(item)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    {item.logo ? (
                      <Image
                        source={{ uri: item.logo }}
                        style={{
                          width: 35,
                          height: 35,
                          borderRadius: 4,
                          marginRight: 10,
                        }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View
                        style={{
                          width: 35,
                          height: 35,
                          borderRadius: 4,
                          marginRight: 10,
                          backgroundColor: "#333",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>📺</Text>
                      </View>
                    )}
                    <Text
                      style={{
                        color: isSelected ? "#FFD700" : "#fff",
                        fontSize: 14,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>

                  <Pressable
                    style={{ padding: 5 }}
                    focusable={true}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Text style={{ fontSize: 16 }}>{isFav ? "⭐" : "☆"}</Text>
                  </Pressable>
                </Pressable>
              );
            }}
          />
        </View>

        {/* SAĞ: OYNATICI (PLAYER) */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selectedChannel ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Video
                source={{ uri: selectedChannel.url }}
                style={{ width: "100%", height: "100%" }}
                controls={true}
                resizeMode="contain"
                onLoadStart={() => setIsVideoLoading(true)}
                onReadyForDisplay={() => setIsVideoLoading(false)}
                onBuffer={({ isBuffering }) => setIsVideoLoading(isBuffering)}
              />
              {isVideoLoading && (
                <View
                  style={{
                    position: "absolute",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: 20,
                    borderRadius: 10,
                  }}
                >
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={{ color: "#fff", marginTop: 10 }}>
                    Kanal Yükleniyor...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ color: "#888", fontSize: 16 }}>
              İzlemek için bir kanal seçin
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
