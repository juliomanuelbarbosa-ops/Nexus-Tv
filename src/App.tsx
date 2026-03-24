/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Channel, XtreamCredentials, AppState, ContentType } from './types';
import { IPTVService } from './services/iptvService';
import { FilterEngine } from './lib/filterEngine';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Player } from './components/Player';

export default function App() {
  const [state, setState] = useState<AppState>({
    channels: [],
    filteredChannels: [],
    activeTab: ContentType.LIVE,
    selectedChannel: null,
    isLoading: false,
    error: null,
    isLoggedIn: false,
    showBlocked: false,
    favorites: JSON.parse(localStorage.getItem('nexus_favorites') || '[]'),
    recentlyPlayed: JSON.parse(localStorage.getItem('nexus_recently_played') || '[]'),
    customFilters: JSON.parse(localStorage.getItem('nexus_filters') || JSON.stringify(FilterEngine.getDefaultFilters())),
  });

  useEffect(() => {
    localStorage.setItem('nexus_favorites', JSON.stringify(state.favorites));
  }, [state.favorites]);

  useEffect(() => {
    localStorage.setItem('nexus_recently_played', JSON.stringify(state.recentlyPlayed));
  }, [state.recentlyPlayed]);

  useEffect(() => {
    localStorage.setItem('nexus_filters', JSON.stringify(state.customFilters));
  }, [state.customFilters]);

  // Load saved credentials if any (optional enhancement)
  useEffect(() => {
    const saved = localStorage.getItem('nexus_iptv_creds');
    if (saved) {
      // Auto-login logic could go here
    }
  }, []);

  const handleLogin = async (creds: XtreamCredentials | string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      let loadedChannels: Channel[] = [];
      if (typeof creds === 'string') {
        loadedChannels = await IPTVService.parseM3U(creds);
      } else {
        loadedChannels = await IPTVService.fetchXtreamChannels(creds);
      }

      const filtered = FilterEngine.applyFilter(loadedChannels, state.customFilters);
      
      setState(prev => ({
        ...prev,
        channels: loadedChannels,
        filteredChannels: filtered,
        isLoggedIn: true,
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to load playlist. Please check your credentials or URL.',
      }));
    }
  };

  const handleLogout = () => {
    setState({
      channels: [],
      filteredChannels: [],
      activeTab: ContentType.LIVE,
      selectedChannel: null,
      isLoading: false,
      error: null,
      isLoggedIn: false,
      showBlocked: false,
      favorites: [],
      recentlyPlayed: [],
      customFilters: FilterEngine.getDefaultFilters(),
    });
  };

  const updateFilters = (filters: any) => {
    setState(prev => ({
      ...prev,
      customFilters: filters,
      filteredChannels: FilterEngine.applyFilter(prev.channels, filters)
    }));
  };

  const handleSelectChannel = (channel: Channel) => {
    setState(prev => {
      const recentlyPlayed = [
        channel.id,
        ...prev.recentlyPlayed.filter(id => id !== channel.id)
      ].slice(0, 20); // Keep last 20

      return {
        ...prev,
        selectedChannel: channel,
        recentlyPlayed
      };
    });
  };

  const toggleFavorite = (channelId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(channelId)
        ? prev.favorites.filter(id => id !== channelId)
        : [...prev.favorites, channelId]
    }));
  };

  const toggleShowBlocked = () => {
    setState(prev => ({ ...prev, showBlocked: !prev.showBlocked }));
  };

  if (!state.isLoggedIn) {
    return <Login onLogin={handleLogin} isLoading={state.isLoading} error={state.error} />;
  }

  return (
    <>
      <Dashboard 
        channels={state.channels}
        filteredChannels={state.filteredChannels}
        favorites={state.favorites}
        recentlyPlayed={state.recentlyPlayed}
        customFilters={state.customFilters}
        showBlocked={state.showBlocked}
        onSelectChannel={handleSelectChannel}
        onToggleFavorite={toggleFavorite}
        onToggleShowBlocked={toggleShowBlocked}
        onUpdateFilters={updateFilters}
        onLogout={handleLogout}
      />
      
      {state.selectedChannel && (
        <Player 
          channel={state.selectedChannel} 
          onClose={() => setState(prev => ({ ...prev, selectedChannel: null }))}
        />
      )}
    </>
  );
}
