import { AppRootProps, SelectableValue, dateTimeParse } from '@grafana/data';
import React, { useState, useEffect } from 'react';
import {} from '@emotion/core';
import { getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { PluginList } from '../components/PluginList';
import { useTheme, Field, Select } from '@grafana/ui';
import { css } from 'emotion';
import { SearchField } from '../components/SearchField';
import { API_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';

export const Browse = ({ query, meta }: AppRootProps) => {
  const { q, filterBy, sortBy } = query;
  const { showUnsigned } = meta.jsonData as MarketplaceAppSettings;

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const theme = useTheme();

  useEffect(() => {
    getBackendSrv()
      .get(`${API_ROOT}/plugins`)
      .then(res => {
        setPlugins(res.items);
      });
  }, []);

  const onSortByChange = (value: SelectableValue<string>) => {
    getLocationSrv().update({
      partial: true,
      replace: false,
      query: {
        sortBy: value.value,
      },
    });
  };

  const onFilterByChange = (value: SelectableValue<string>) => {
    getLocationSrv().update({
      partial: true,
      replace: false,
      query: {
        filterBy: value.value,
      },
    });
  };

  const filteredPlugins = plugins
    // Exclude Enterprise plugins
    .filter(plugin => plugin.status === 'active')
    // Naïve search by checking if any of the properties contains the query string
    .filter(plugin => {
      const fields = [plugin.name.toLowerCase(), plugin.orgName.toLowerCase()];
      return !q || fields.some(f => f.includes(q.toLowerCase()));
    })
    // Filter by plugin type
    .filter(_ => !filterBy || _.typeCode === filterBy || filterBy === 'all')
    .filter(_ => _.versionSignatureType || showUnsigned);

  filteredPlugins.sort(sorters[sortBy || 'name']);

  return (
    <>
      <SearchField
        value={q}
        onSearch={q => {
          getLocationSrv().update({
            partial: true,
            replace: false,
            query: { q },
          });
        }}
      />
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <div
          className={css`
            flex-grow: 1;
          `}
        >
          {filteredPlugins.length} results
        </div>
        <Field label="Show">
          <Select
            width={15}
            value={filterBy || 'all'}
            onChange={onFilterByChange}
            options={[
              { value: 'all', label: 'All' },
              { value: 'panel', label: 'Panels' },
              { value: 'datasource', label: 'Data sources' },
              { value: 'app', label: 'Apps' },
            ]}
          />
        </Field>
        <Field
          label="Sort by"
          className={css`
            margin-left: ${theme.spacing.sm};
          `}
        >
          <Select
            width={20}
            value={sortBy || 'name'}
            onChange={onSortByChange}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'popularity', label: 'Popularity' },
              { value: 'updated', label: 'Updated date' },
              { value: 'published', label: 'Published date' },
              { value: 'downloads', label: 'Downloads' },
            ]}
          />
        </Field>
      </div>
      <PluginList plugins={filteredPlugins} />
    </>
  );
};

const sorters: { [name: string]: (a: Plugin, b: Plugin) => number } = {
  name: (a: Plugin, b: Plugin) => a.name.localeCompare(b.name),
  updated: (a: Plugin, b: Plugin) => dateTimeParse(b.updatedAt).valueOf() - dateTimeParse(a.updatedAt).valueOf(),
  published: (a: Plugin, b: Plugin) => dateTimeParse(b.createdAt).valueOf() - dateTimeParse(a.createdAt).valueOf(),
  downloads: (a: Plugin, b: Plugin) => b.downloads - a.downloads,
  popularity: (a: Plugin, b: Plugin) => b.popularity - a.popularity,
};
