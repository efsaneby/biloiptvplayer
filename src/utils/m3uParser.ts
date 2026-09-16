// 1. ARAYÜZ (INTERFACE) TANIMLARI
export interface Category {
  category_id: string;
  category_name: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  category_id: string;
}

export interface VodItem {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  container_extension: string;
  rating?: string;
}

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
  url?: string;
}

export interface UserAccountInfo {
  username: string;
  status: string;
  exp_date: string | null;
}

// GÜVENLİ YARDIMCI FONKSİYONLAR
const cleanUrl = (server: string): string => {
  let cleaned = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned;
};

export async function safeFetchJson(
  url: string,
  retries = 2,
  delay = 2000,
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye zaman aşımı

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPTV-Player",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Sunucu 502, 500 veya 504 verirse ve deneme hakkı varsa tekrar dene
      if (response.status >= 500 && retries > 0) {
        console.warn(
          `Sunucu yanıt vermedi (${response.status}). Tekrar deneniyor... (${retries} hak kaldı)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return safeFetchJson(url, retries - 1, delay * 1.5);
      }

      throw new Error(
        `HTTP Hatası: ${response.status} - Sunucu geçici olarak hizmet veremiyor.`,
      );
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(
        "Sunucu yanıt verme süresi aşıldı (Timeout). Lütfen bağlantınızı kontrol edin.",
      );
    }

    // Tekrar deneme hakkı kaldıysa ağ hatalarında da dene
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return safeFetchJson(url, retries - 1, delay * 1.5);
    }

    throw error;
  }
}

// 2. LIVE TV API FONKSİYONLARI
export const fetchCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_live_categories`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((cat: any) => ({
    category_id: cat.category_id?.toString() || "",
    category_name: cat.category_name || "Diğer",
  }));
};

export const fetchChannels = async (
  server: string,
  user: string,
  pass: string,
): Promise<Channel[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_live_streams`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    id: item.stream_id?.toString() || Math.random().toString(),
    name: item.name || "Bilinmeyen Kanal",
    logo: item.stream_icon || "",
    group: item.category_id?.toString() || "",
    category_id: item.category_id?.toString() || "",
    url: `${baseUrl}/live/${user}/${pass}/${item.stream_id}.ts`,
  }));
};

// 3. MOVIES (VOD) API FONKSİYONLARI
export const fetchVodCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_vod_categories`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((cat: any) => ({
    category_id: cat.category_id?.toString() || "",
    category_name: cat.category_name || "Diğer",
  }));
};

export const fetchVodStreams = async (
  server: string,
  user: string,
  pass: string,
): Promise<VodItem[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_vod_streams`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    ...item,
    category_id: item.category_id?.toString() || "",
  }));
};

// 4. SERIES API FONKSİYONLARI
export const fetchSeriesCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_series_categories`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((cat: any) => ({
    category_id: cat.category_id?.toString() || "",
    category_name: cat.category_name || "Diğer",
  }));
};

export const fetchSeries = async (
  server: string,
  user: string,
  pass: string,
): Promise<SeriesItem[]> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_series`;
  const data = await safeFetchJson(url);

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    ...item,
    category_id: item.category_id?.toString() || "",
  }));
};

export const fetchSeriesInfo = async (
  server: string,
  user: string,
  pass: string,
  seriesId: number,
): Promise<{ [season: string]: Episode[] }> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_series_info&series_id=${seriesId}`;
  const data = await safeFetchJson(url);

  if (!data || !data.episodes) return {};

  const episodesData = data.episodes;
  const formattedEpisodes: { [season: string]: Episode[] } = {};

  Object.keys(episodesData).forEach((seasonNum) => {
    formattedEpisodes[seasonNum] = episodesData[seasonNum].map((ep: any) => {
      const ext = ep.container_extension || "mp4";
      return {
        id: ep.id?.toString() || "",
        episode_num: ep.episode_num,
        title: ep.title,
        container_extension: ext,
        url: `${baseUrl}/series/${user}/${pass}/${ep.id}.${ext}`,
      };
    });
  });

  return formattedEpisodes;
};

// 5. KULLANICI BİLGİLERİ API FONKSİYONU
export const fetchUserInfo = async (
  server: string,
  user: string,
  pass: string,
): Promise<UserAccountInfo | null> => {
  const baseUrl = cleanUrl(server);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
  const data = await safeFetchJson(url);

  if (data && data.user_info) {
    return {
      username: data.user_info.username,
      status: data.user_info.status,
      exp_date: data.user_info.exp_date,
    };
  }
  return null;
};
