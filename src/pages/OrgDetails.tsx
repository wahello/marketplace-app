import { AppRootProps } from '@grafana/data';
import React, { useState, useEffect } from 'react';
import {} from '@emotion/core';
import { getBackendSrv } from '@grafana/runtime';
import { css } from 'emotion';
import { API_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';
import { PluginList } from '../components/PluginList';

import {} from '@emotion/core';

export const OrgDetails = ({ query, meta }: AppRootProps) => {
  const { orgSlug } = query;
  const { showUnsigned } = meta.jsonData as MarketplaceAppSettings;

  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    getBackendSrv()
      .get(`${API_ROOT}/plugins`)
      .then(res => {
        setPlugins(
          res.items
            .filter((plugin: Plugin) => plugin.orgSlug === orgSlug)
            .filter((plugin: Plugin) => plugin.versionSignatureType || showUnsigned)
        );
      });
  }, [orgSlug, showUnsigned]);

  return (
    <>
      <div
        className={css`
          margin: 64px 0;
        `}
      >
        <h1>{orgSlug}</h1>
      </div>
      <PluginList plugins={plugins} />
    </>
  );
};
