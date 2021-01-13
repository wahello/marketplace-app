import { AppRootProps, GrafanaTheme } from '@grafana/data';
import React, { useState, useEffect } from 'react';
import {} from '@emotion/core';
import { getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { PluginList } from '../components/PluginList';
import { useTheme, Legend, stylesFactory } from '@grafana/ui';
import { dateTimeParse } from '@grafana/data';
import { css } from 'emotion';
import { Card } from '../components/Card';
import { SearchField } from '../components/SearchField';
import { Grid } from '../components/Grid';
import { API_ROOT, PLUGIN_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';

export const Discover = ({ meta }: AppRootProps) => {
  const { showUnsigned } = meta.jsonData as MarketplaceAppSettings;

  const [plugins, setPlugins] = useState<Plugin[]>([]);

  const theme = useTheme();

  useEffect(() => {
    getBackendSrv()
      .get(`${API_ROOT}/plugins`)
      .then(res => {
        setPlugins(res.items.filter((plugin: Plugin) => plugin.versionSignatureType || showUnsigned));
      });
  }, [showUnsigned]);

  const styles = getStyles(theme);

  const featuredPlugins = plugins.filter(_ => _.featured > 0);
  featuredPlugins.sort((a: Plugin, b: Plugin) => {
    return b.featured - a.featured;
  });

  const recentlyAdded = plugins.filter(_ => true);
  recentlyAdded.sort((a: Plugin, b: Plugin) => {
    const at = dateTimeParse(a.createdAt);
    const bt = dateTimeParse(b.createdAt);
    return bt.valueOf() - at.valueOf();
  });

  const mostPopular = plugins.filter(_ => true);
  mostPopular.sort((a: Plugin, b: Plugin) => {
    return b.popularity - a.popularity;
  });

  return (
    <>
      <div
        className={css`
          margin-bottom: ${theme.spacing.lg};
        `}
      >
        <h1>Discover</h1>
      </div>
      <SearchField
        onSearch={q => {
          getLocationSrv().update({
            partial: true,
            replace: true,
            query: { q, tab: 'browse' },
          });
        }}
      />

      <Legend className={styles.legend}>Featured</Legend>
      <PluginList
        plugins={featuredPlugins.filter((_, idx) => {
          return idx < 5;
        })}
      />

      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <Legend className={styles.legend}>Most popular</Legend>
        <div
          className={css`
            min-width: 8ch;
            font-weight: 500;
          `}
        >
          <a href={`${PLUGIN_ROOT}?tab=browse&sortBy=popularity`}>See more</a>
        </div>
      </div>
      <PluginList
        plugins={mostPopular.filter((_, idx) => {
          return idx < 5;
        })}
      />

      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <Legend className={styles.legend}>Recently added</Legend>
        <div
          className={css`
            min-width: 8ch;
            font-weight: 500;
          `}
        >
          <a href={`${PLUGIN_ROOT}?tab=browse&sortBy=published`}>See more</a>
        </div>
      </div>
      <PluginList
        plugins={recentlyAdded.filter((_, idx) => {
          return idx < 5;
        })}
      />
      <Legend className={styles.legend}>Browse by type</Legend>
      <Grid columns={3}>
        <a href={`${PLUGIN_ROOT}?tab=browse&filterBy=panel`}>
          <Card>Panels</Card>
        </a>
        <a href={`${PLUGIN_ROOT}?tab=browse&filterBy=datasource`}>
          <Card>Data sources</Card>
        </a>
        <a href={`${PLUGIN_ROOT}?tab=browse&filterBy=app`}>
          <Card>Apps</Card>
        </a>
      </Grid>
    </>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    legend: css`
      margin-top: ${theme.spacing.xl};
    `,
  };
});
