export interface Category {
  category_id: string;
  category_name: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  categoryId: string;
  url: string;
}

export interface Movie {
  id: string;
  name: string;
  logo: string;
  categoryId: string;
  rating: string;
  containerExtension: string;
  url: string;
}

export interface Series {
  id: string;
  name: string;
  logo: string;
  categoryId: string;
  rating: string;
}

// Canlı TV Kanallarını Parse Etme
export const parseXtreamChannels = (
  data: any[],
  serverUrl: string,
  username: string,
  pass: string
): Channel[] => {
  if (!Array.isArray(data)) return [];

  const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;

  return data.map((item: any) => {
    const streamId = item.stream_id;
    const extension = item.container_extension || 'm3u8';

    return {
      id: String(streamId || Math.random()),
      name: item.name || 'İsimsiz Kanal',
      logo: item.stream_icon || '',
      group: item.category_name || 'Genel',
      categoryId: String(item.category_id || ''),
      url: `${baseUrl}/live/${username}/${pass}/${streamId}.${extension}`,
    };
  });
};

// Filmleri (VOD) Parse Etme
export const parseXtreamMovies = (
  data: any[],
  serverUrl: string,
  username: string,
  pass: string
): Movie[] => {
  if (!Array.isArray(data)) return [];

  const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;

  return data.map((item: any) => {
    const streamId = item.stream_id;
    const extension = item.container_extension || 'mp4';

    return {
      id: String(streamId || Math.random()),
      name: item.name || 'İsimsiz Film',
      logo: item.stream_icon || '',
      categoryId: String(item.category_id || ''),
      rating: String(item.rating || 'N/A'),
      containerExtension: extension,
      url: `${baseUrl}/movie/${username}/${pass}/${streamId}.${extension}`,
    };
  });
};

// Dizileri Parse Etme
export const parseXtreamSeries = (data: any[]): Series[] => {
  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    id: String(item.series_id || Math.random()),
    name: item.name || 'İsimsiz Dizi',
    logo: item.cover || item.stream_icon || '',
    categoryId: String(item.category_id || ''),
    rating: String(item.rating || 'N/A'),
  }));
};