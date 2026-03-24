/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from '../types';

export const FilterEngine = {
  getDefaultFilters() {
    return {
      blockedLanguages: ['ara', 'fas', 'hin', 'arabic', 'persian', 'hindi', 'فارسی', 'عربي', 'هندي'],
      blockedCountries: ['IN', 'India'],
      blockedKeywords: [
        'arabic', 'عربي', 'persian', 'فارسی', 'hindi', 'هندي',
        'bollywood', 'indian', 'india', 'arabic channels', 'persian movies', 'hindi series'
      ]
    };
  },

  shouldHide(channel: Channel, customFilters?: any): boolean {
    const filters = customFilters || this.getDefaultFilters();
    const nameLower = (channel.name || '').toLowerCase();
    const groupLower = (channel.groupTitle || '').toLowerCase();
    const langLower = (channel.tvgLanguage || '').toLowerCase();
    const countryStr = (channel.country || '');

    // Language block
    if (filters.blockedLanguages.some((lang: string) => langLower.includes(lang.toLowerCase()) || nameLower.includes(lang.toLowerCase()))) {
      return true;
    }

    // Country block
    if (filters.blockedCountries.some((country: string) => 
      countryStr.toUpperCase() === country.toUpperCase() || 
      nameLower.includes(country.toLowerCase())
    )) {
      return true;
    }

    // Keyword block
    if (filters.blockedKeywords.some((keyword: string) => nameLower.includes(keyword.toLowerCase()) || groupLower.includes(keyword.toLowerCase()))) {
      return true;
    }

    return false;
  },

  applyFilter(list: Channel[], customFilters?: any): Channel[] {
    return list.map(ch => ({
      ...ch,
      isBlocked: this.shouldHide(ch, customFilters)
    }));
  }
};
