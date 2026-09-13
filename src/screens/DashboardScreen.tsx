import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { styles } from "../styles/appStyles";

interface DashboardScreenProps {
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
      <View style={styles.dashHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.dashTitle}>BİLO IPTV PLAYER</Text>
          <Text style={styles.dashSubtitle}> | Premium Edition</Text>
        </View>

        {/* SAĞ ÜST BİLGİ ALANI (GÜNCELLENDİ) */}
        <View style={styles.dashHeaderRight}>
          <View style={{ alignItems: "flex-end", marginRight: 12 }}>
            <Text style={styles.userInfo}>👤 {userInput}</Text>
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
            onNavigate("live");
          }}
        >
          <Text style={styles.cardIcon}>📺</Text>
          <Text style={styles.cardTitle}>LIVE TV</Text>
          <Text style={styles.cardCount}>{allChannelsCount} Kanal</Text>
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
          style={({ focused }: any) => [
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
                onPress={onSaveCredentials}
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
};
