/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { Channel, ContentType, XtreamCredentials } from '../types';

export const IPTVService = {
  async fetchXtreamChannels(creds: XtreamCredentials): Promise<Channel[]> {
    const { host, username, password } = creds;
    const baseUrl = host.endsWith('/') ? host.slice(0, -1) : host;
    const apiEndpoint = `${baseUrl}/player_api.php?username=${username}&password=${password}`;

    try {
      // 1. Authenticate and get user info via proxy
      const authResponse = await axios.get(`/api/proxy?url=${encodeURIComponent(apiEndpoint)}`);
      if (authResponse.data.user_info.auth === 0) {
        throw new Error('Invalid credentials');
      }

      // 2. Fetch Live, VOD, and Series via proxy
      const [liveRes, vodRes, seriesRes] = await Promise.all([
        axios.get(`/api/proxy?url=${encodeURIComponent(`${apiEndpoint}&action=get_live_streams`)}`),
        axios.get(`/api/proxy?url=${encodeURIComponent(`${apiEndpoint}&action=get_vod_streams`)}`),
        axios.get(`/api/proxy?url=${encodeURIComponent(`${apiEndpoint}&action=get_series`)}`)
      ]);

      const channels: Channel[] = [];
      // ... rest of the mapping logic remains the same

      // Map Live
      if (Array.isArray(liveRes.data)) {
        liveRes.data.forEach((item: any) => {
          channels.push({
            id: `live-${item.stream_id}`,
            name: item.name,
            url: `${baseUrl}/live/${username}/${password}/${item.stream_id}.m3u8`,
            logo: item.stream_icon,
            groupTitle: item.category_name,
            type: ContentType.LIVE
          });
        });
      }

      // Map VOD
      if (Array.isArray(vodRes.data)) {
        vodRes.data.forEach((item: any) => {
          channels.push({
            id: `vod-${item.stream_id}`,
            name: item.name,
            url: `${baseUrl}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
            logo: item.stream_icon,
            groupTitle: item.category_name,
            type: ContentType.MOVIE
          });
        });
      }

      // Map Series
      if (Array.isArray(seriesRes.data)) {
        seriesRes.data.forEach((item: any) => {
          channels.push({
            id: `series-${item.series_id}`,
            name: item.name,
            url: `${baseUrl}/series/${username}/${password}/${item.series_id}.m3u8`, // Note: Series usually needs more complex fetching
            logo: item.last_modified,
            groupTitle: item.category_name,
            type: ContentType.SERIES
          });
        });
      }

      return channels;
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      console.error('IPTV Fetch Error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  async parseM3U(url: string): Promise<Channel[]> {
    try {
      const response = await axios.get(`/api/proxy?url=${encodeURIComponent(url)}`);
      const content = response.data;
      const lines = content.split('\n');
      const channels: Channel[] = [];
      let currentChannel: Partial<Channel> = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
          const nameMatch = line.match(/,(.*)$/);
          const logoMatch = line.match(/tvg-logo="(.*?)"/);
          const groupMatch = line.match(/group-title="(.*?)"/);
          const langMatch = line.match(/tvg-language="(.*?)"/);
          const countryMatch = line.match(/tvg-country="(.*?)"/);

          currentChannel = {
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            logo: logoMatch ? logoMatch[1] : undefined,
            groupTitle: groupMatch ? groupMatch[1] : undefined,
            tvgLanguage: langMatch ? langMatch[1] : undefined,
            country: countryMatch ? countryMatch[1] : undefined,
            type: ContentType.LIVE, // Default for M3U
            id: Math.random().toString(36).substr(2, 9)
          };
        } else if (line.startsWith('http')) {
          currentChannel.url = line;
          if (currentChannel.name && currentChannel.url) {
            channels.push(currentChannel as Channel);
          }
          currentChannel = {};
        }
      }
      return channels;
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      console.error('M3U Parse Error:', errorMsg);
      throw new Error(errorMsg);
    }
  }
};
