/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XtreamCredentials } from '../types';
import { Shield, LayoutGrid, Server, Link as LinkIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (creds: XtreamCredentials | string) => void;
  isLoading: boolean;
  error: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error }) => {
  const [mode, setMode] = useState<'xtream' | 'm3u'>('xtream');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'xtream') {
      onLogin({ host, username, password });
    } else {
      onLogin(m3uUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-2xl mb-4">
            <Shield className="text-orange-500 w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">NEXUS IPTV</h1>
          <p className="text-white/40 uppercase tracking-widest text-xs font-semibold">Zero-Clutter Edition</p>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-black/40 p-1 rounded-xl mb-8">
            <button
              onClick={() => setMode('xtream')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'xtream' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'
              }`}
            >
              <Server size={16} /> Xtream
            </button>
            <button
              onClick={() => setMode('m3u')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'm3u' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'
              }`}
            >
              <LinkIcon size={16} /> M3U URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'xtream' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Host URL</label>
                  <input
                    type="url"
                    placeholder="http://example.com:8080"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Username</label>
                  <input
                    type="text"
                    placeholder="Your username"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/40 uppercase ml-1">M3U Playlist URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/playlist.m3u"
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LayoutGrid size={18} />
                  LOAD & CLEAN PLAYLIST
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs font-medium uppercase tracking-widest">
          English-First Clean Profile Active
        </p>
      </div>
    </div>
  );
};
