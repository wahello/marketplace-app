import { AppRootProps, dateTimeFormatTimeAgo } from '@grafana/data';
import React, { useState, useEffect } from 'react';
import {} from '@emotion/core';
import { getBackendSrv } from '@grafana/runtime';
import { useTheme, TabsBar, TabContent, Tab, Button, Icon } from '@grafana/ui';
import { css } from 'emotion';
import { PLUGIN_ROOT, API_ROOT, GRAFANA_API_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';

import {} from '@emotion/core';

interface Metadata {
  info: {
    version: string;
    links: {
      name: string;
      url: string;
    }[];
  };
  dev: boolean;
}

export const PluginDetails = ({ query, meta }: AppRootProps) => {
  const [remotePlugin, setRemotePlugin] = useState<Plugin>();
  const [remoteVersions, setRemoteVersions] = useState([]);

  const [localPlugin, setLocalPlugin] = useState<Metadata>();

  const [installed, setInstalled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState([
    { label: 'Overview', active: true },
    { label: 'Version history', active: false },
  ]);

  const { slug } = query;
  const { pluginDir } = meta.jsonData as MarketplaceAppSettings;

  const theme = useTheme();

  useEffect(() => {
    getBackendSrv()
      .get(`${API_ROOT}/plugins/${slug}`)
      .then(res => {
        setRemotePlugin(res);
      });

    getBackendSrv()
      .get(`${API_ROOT}/plugins/${slug}/versions`)
      .then(res => {
        setRemoteVersions(res.items);
      });

    getBackendSrv()
      .get(`${API_ROOT}/installed?pluginDir=${pluginDir}`)
      .then((res: any[]) => {
        const plugin = res.find(_ => _.id === slug);
        setInstalled(!!plugin);
        setLocalPlugin(plugin);
      });
  }, [slug, pluginDir]);

  const onInstall = () => {
    setLoading(true);
    getBackendSrv()
      .post(
        `${API_ROOT}/install`,
        JSON.stringify({
          url: `${GRAFANA_API_ROOT}/plugins/${slug}/versions/${remotePlugin?.version}/download`,
          pluginDir,
        })
      )
      .then(() => {
        setInstalled(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onUninstall = () => {
    setLoading(true);
    getBackendSrv()
      .post(`${API_ROOT}/uninstall`, JSON.stringify({ slug, pluginDir }))
      .then(() => {
        setInstalled(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div
        className={css`
          display: flex;
          margin: 64px 0;
        `}
      >
        <img
          src={`${GRAFANA_API_ROOT}/plugins/${slug}/versions/${remotePlugin?.version}/logos/small`}
          className={css`
            max-width: 128px;
            max-height: 128px;
          `}
        />
        <div
          className={css`
            margin-left: ${theme.spacing.lg};
          `}
        >
          <h1>{remotePlugin?.name}</h1>
          <div
            className={css`
              display: flex;
              align-items: center;
              margin-top: ${theme.spacing.sm};
              margin-bottom: ${theme.spacing.lg};
              & > * {
                &::after {
                  content: '|';
                  padding: 0 ${theme.spacing.md};
                }
              }
              & > *:last-child {
                &::after {
                  content: '';
                  padding-right: 0;
                }
              }
              font-size: ${theme.typography.size.lg};
            `}
          >
            <a
              className={css`
                font-size: ${theme.typography.size.lg};
              `}
              href={`${PLUGIN_ROOT}?tab=org&orgSlug=${remotePlugin?.orgSlug}`}
            >
              {remotePlugin?.orgName}
            </a>
            {localPlugin?.info?.links?.map((link: any) => (
              <a href={link.url}>{link.name}</a>
            ))}
            <span>
              <Icon name="cloud-download" />
              &nbsp;
              {remotePlugin && `${new Intl.NumberFormat().format(remotePlugin.downloads)}`}
            </span>
            {localPlugin?.info && <span>{localPlugin?.info?.version}</span>}
          </div>
          <p>{remotePlugin?.description}</p>
          {!installed && (
            <Button disabled={installed || loading} onClick={onInstall}>
              {loading ? 'Installing' : 'Install'}
            </Button>
          )}
          {installed && !localPlugin?.dev && (
            <Button variant="destructive" disabled={loading} onClick={onUninstall}>
              {loading ? 'Uninstalling' : 'Uninstall'}
            </Button>
          )}
          {localPlugin?.dev && (
            <p
              className={css`
                color: ${theme.colors.textSemiWeak};
              `}
            >
              This is a development build of the plugin and can't be uninstalled.
            </p>
          )}
          <div
            className={css`
              margin-top: ${theme.spacing.md};
            `}
          >
            <a href={`https://grafana.com/plugins/${slug}`}>View on grafana.com</a>
          </div>
        </div>
      </div>
      <TabsBar>
        {tabs.map((tab, key) => (
          <Tab
            key={key}
            label={tab.label}
            active={tab.active}
            onChangeTab={() => {
              setTabs(tabs.map((tab, index) => ({ ...tab, active: index === key })));
            }}
          />
        ))}
      </TabsBar>
      <TabContent>
        {tabs.find(_ => _.label === 'Overview')?.active && (
          <div
            className={css`
              & img {
                max-width: 100%;
              }
              margin: ${theme.spacing.lg} 0;
            `}
            dangerouslySetInnerHTML={{ __html: remotePlugin?.readme ?? '' }}
          ></div>
        )}
        {tabs.find(_ => _.label === 'Version history')?.active && (
          <table
            className={css`
              width: 100%;
              td,
              th {
                padding: ${theme.spacing.sm} 0;
              }
            `}
          >
            <thead>
              <tr>
                <th>Version</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {remoteVersions.map((_: any) => {
                return (
                  <tr>
                    <td>{_.version}</td>
                    <td>{dateTimeFormatTimeAgo(_.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TabContent>
    </>
  );
};
