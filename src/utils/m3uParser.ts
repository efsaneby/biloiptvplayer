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

export const parseXtreamChannels = (data: any[], serverUrl: string, username: string, pass: string): Channel[] => {
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