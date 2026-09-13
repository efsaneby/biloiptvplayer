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
}

// 2. LIVE TV API FONKSİYONLARI
export const fetchCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_categories`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Canlı Yayın Kategorileri Çekilemedi:", error);
    return [];
  }
};

export const fetchChannels = async (
  server: string,
  user: string,
  pass: string,
): Promise<Channel[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`,
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.stream_id?.toString() || Math.random().toString(),
        name: item.name || "Bilinmeyen Kanal",
        logo: item.stream_icon || "",
        group: item.category_id || "",
        category_id: item.category_id?.toString() || "",
        url: `${server}/live/${user}/${pass}/${item.stream_id}.ts`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Kanallar Çekilemedi:", error);
    return [];
  }
};

// 3. MOVIES (VOD) API FONKSİYONLARI
export const fetchVodCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_vod_categories`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Film Kategorileri Çekilemedi:", error);
    return [];
  }
};

export const fetchVodStreams = async (
  server: string,
  user: string,
  pass: string,
): Promise<VodItem[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_vod_streams`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Filmler Çekilemedi:", error);
    return [];
  }
};

// 4. SERIES API FONKSİYONLARI
export const fetchSeriesCategories = async (
  server: string,
  user: string,
  pass: string,
): Promise<Category[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_series_categories`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Dizi Kategorileri Çekilemedi:", error);
    return [];
  }
};

export const fetchSeries = async (
  server: string,
  user: string,
  pass: string,
): Promise<SeriesItem[]> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_series`,
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Diziler Çekilemedi:", error);
    return [];
  }
};

export const fetchSeriesInfo = async (
  server: string,
  user: string,
  pass: string,
  seriesId: number,
): Promise<{ [season: string]: Episode[] }> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}&action=get_series_info&series_id=${seriesId}`,
    );
    const data = await res.json();
    const episodesData = data.episodes || {};

    // API gelen sezon/bölüm yapısını formatlama
    const formattedEpisodes: { [season: string]: Episode[] } = {};
    Object.keys(episodesData).forEach((seasonNum) => {
      formattedEpisodes[seasonNum] = episodesData[seasonNum].map((ep: any) => ({
        id: ep.id,
        episode_num: ep.episode_num,
        title: ep.title,
        container_extension: ep.container_extension || "mp4",
      }));
    });

    return formattedEpisodes;
  } catch (error) {
    console.error("Dizi Detayları/Bölümleri Çekilemedi:", error);
    return {};
  }
};

export interface UserAccountInfo {
  username: string;
  status: string;
  exp_date: string | null; // Unix timestamp
}

export const fetchUserInfo = async (
  server: string,
  user: string,
  pass: string,
): Promise<UserAccountInfo | null> => {
  try {
    const res = await fetch(
      `${server}/player_api.php?username=${user}&password=${pass}`,
    );
    const data = await res.json();
    if (data && data.user_info) {
      return {
        username: data.user_info.username,
        status: data.user_info.status,
        exp_date: data.user_info.exp_date,
      };
    }
    return null;
  } catch (error) {
    console.error("Kullanıcı Bilgileri Çekilemedi:", error);
    return null;
  }
};
