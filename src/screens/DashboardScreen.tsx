import React from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { styles } from "../styles/appStyles";

type CustomPressableState = { pressed: boolean; focused?: boolean };

export interface DashboardScreenProps {
  userInput: string;
  expDate: string | null;
  allChannelsCount: number;
  allMoviesCount: number;
  allSeriesCount: number;
  moviesLoading: boolean;
  seriesLoading: boolean;
  seriesLoaded: boolean;
  isModalOpen: boolean;
  serverInput: string;
  passInput: string;
  categoryTab?: "ALL" | "FAV";
  setCategoryTab?: (tab: "ALL" | "FAV") => void;
  setServerInput: (val: string) => void;
  setUserInput: (val: string) => void;
  setPassInput: (val: string) => void;
  setIsModalOpen: (val: boolean) => void;
  onNavigate: (screen: "live" | "movies" | "series") => void;
  onSaveCredentials: () => void;
  onFetchMovies: () => void;
  onFetchSeries: () => void;
  setSearchQuery: (val: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userInput,
  expDate,
  allChannelsCount,
  allMoviesCount,
  allSeriesCount,
  moviesLoading,
  seriesLoading,
  seriesLoaded,
  isModalOpen,
  serverInput,
  passInput,
  setServerInput,
  setUserInput,
  setPassInput,
  setIsModalOpen,
  onNavigate,
  onSaveCredentials,
  onFetchMovies,
  onFetchSeries,
  setSearchQuery,
}) => {
  return (
    <View style={styles.dashboardContainer}>
      {/* ÜST BAŞLIK BÖLÜMÜ */}
      <View style={styles.dashHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.dashTitle}>BİLO IPTV PLAYER</Text>
          <Text style={styles.dashSubtitle}> | Premium Edition</Text>
        </View>

        <View style={styles.dashHeaderRight}>
          <View style={{ alignItems: "flex-end", marginRight: 12 }}>
            <Text style={styles.userInfo}>
              👤 {userInput || "Giriş Yapılmadı"}
            </Text>
            {expDate && (
              <Text
                style={{
                  color: "#FFD700",
                  fontSize: 12,
                  marginTop: 2,
                  fontWeight: "600",
                }}
              >
                ⏳ Bitiş: {expDate}
              </Text>
            )}
          </View>

          <Pressable
            style={({ focused }: CustomPressableState) => [
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

      {/* KARTLAR CONTAINER */}
      <View style={styles.cardsContainer}>
        <Pressable
          style={({ focused }: CustomPressableState) => [
            styles.dashCard,
            styles.liveCard,
            focused && styles.dashCardFocused,
          ]}
          focusable={true}
          hasTVPreferredFocus={true}
          onPress={() => {
            setSearchQuery("");
            onNavigate("live");
          }}
        >
          <Text style={styles.cardIcon}>📺</Text>
          <Text style={styles.cardTitle}>LIVE TV</Text>
          <Text style={styles.cardCount}>{allChannelsCount} Kanal</Text>
        </Pressable>

        <Pressable
          style={({ focused }: CustomPressableState) => [
            styles.dashCard,
            styles.moviesCard,
            focused && styles.dashCardFocused,
          ]}
          focusable={true}
          onPress={() => {
            setSearchQuery("");
            onNavigate("movies");
            onFetchMovies();
          }}
        >
          <Text style={styles.cardIcon}>🎬</Text>
          <Text style={styles.cardTitle}>MOVIES</Text>
          <Text style={styles.cardCount}>
            {moviesLoading ? "Yükleniyor..." : `${allMoviesCount} Film`}
          </Text>
        </Pressable>

        <Pressable
          style={({ focused }: CustomPressableState) => [
            styles.dashCard,
            styles.seriesCard,
            focused && styles.dashCardFocused,
          ]}
          focusable={true}
          onPress={() => {
            setSearchQuery("");
            onNavigate("series");
            onFetchSeries();
          }}
        >
          <Text style={styles.cardIcon}>🍿</Text>
          <Text style={styles.cardTitle}>SERIES</Text>
          <Text style={styles.cardCount}>
            {seriesLoading && !seriesLoaded
              ? "Yükleniyor..."
              : `${allSeriesCount} Dizi`}
          </Text>
        </Pressable>
      </View>

      {/* GİRİŞ BİLGİLERİ (AYARLAR) MODALI */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>IPTV Giriş Bilgileri</Text>

            <Text style={styles.inputLabel}>Sunucu URL (DNS):</Text>
            <TextInput
              style={styles.modalInput}
              value={serverInput}
              onChangeText={setServerInput}
              placeholder="http://example.com:8080"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Kullanıcı Adı:</Text>
            <TextInput
              style={styles.modalInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Şifre:</Text>
            <TextInput
              style={styles.modalInput}
              value={passInput}
              onChangeText={setPassInput}
              secureTextEntry
              placeholder="Şifre"
              placeholderTextColor="#666"
            />

            <View style={[styles.modalButtons, { marginTop: 20 }]}>
              <Pressable
                style={({ focused }: CustomPressableState) => [
                  styles.btn,
                  styles.cancelBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.btnText}>İptal</Text>
              </Pressable>

              <Pressable
                style={({ focused }: CustomPressableState) => [
                  styles.btn,
                  styles.saveBtn,
                  focused && styles.focusedBtn,
                ]}
                focusable={true}
                onPress={onSaveCredentials}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: "#000", fontWeight: "bold" },
                  ]}
                >
                  Kaydet & Yükle
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
