import { AppRootProps } from '@grafana/data';
import React, { useState, useEffect } from 'react';
import {} from '@emotion/core';
import { getBackendSrv } from '@grafana/runtime';
import { css } from 'emotion';
import { API_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';
import { PluginList } from '../components/PluginList';
import { useTheme } from '@grafana/ui';

import {} from '@emotion/core';

export const Library = ({ meta }: AppRootProps) => {
  const { showUnsigned, pluginDir } = meta.jsonData as MarketplaceAppSettings;

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installed, setInstalled] = useState<any[]>([]);

  const theme = useTheme();

  useEffect(() => {
    getBackendSrv()
      .get(`${API_ROOT}/plugins`)
      .then(res => {
        setPlugins(res.items.filter((plugin: Plugin) => plugin.versionSignatureType || showUnsigned));
      });

    getBackendSrv()
      .get(`${API_ROOT}/installed?pluginDir=${pluginDir}`)
      .then((res: any[]) => {
        setInstalled(res);
      });
  }, [pluginDir, showUnsigned]);

  return (
    <>
      <div
        className={css`
          margin-bottom: ${theme.spacing.lg};
        `}
      >
        <h1>Library</h1>
      </div>
      <PluginList plugins={plugins.filter(plugin => !!installed.find(_ => _.id === plugin.slug))} />
    </>
  );
};
