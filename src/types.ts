/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ContentType {
  LIVE = 'LIVE',
  MOVIE = 'MOVIE',
  SERIES = 'SERIES'
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  groupTitle?: string;
  tvgLanguage?: string;
  country?: string;
  type: ContentType;
  streamId?: string;
  containerExtension?: string;
  isFavorite?: boolean;
  isBlocked?: boolean;
}

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

export interface AppState {
  channels: Channel[];
  filteredChannels: Channel[];
  activeTab: ContentType;
  selectedChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  showBlocked: boolean;
  favorites: string[]; // Array of channel IDs
  recentlyPlayed: string[]; // Array of channel IDs
  customFilters: {
    blockedLanguages: string[];
    blockedCountries: string[];
    blockedKeywords: string[];
  };
}
