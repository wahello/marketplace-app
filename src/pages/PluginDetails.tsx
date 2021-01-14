import { AppRootProps, dateTimeFormatTimeAgo, GrafanaTheme } from '@grafana/data';
import React, { useState, useEffect, useCallback } from 'react';
import {} from '@emotion/core';
import { getBackendSrv } from '@grafana/runtime';
import { useTheme, TabsBar, TabContent, Tab, Button, Icon, stylesFactory, Select } from '@grafana/ui';
import { css } from 'emotion';
import { PLUGIN_ROOT, API_ROOT, GRAFANA_API_ROOT } from '../constants';
import { MarketplaceAppSettings, Plugin } from '../types';
import { config } from '@grafana/runtime';
import { gt, satisfies } from 'semver';

import {} from '@emotion/core';

interface Metadata {
  info: {
    version: string;
    links: Array<{
      name: string;
      url: string;
    }>;
  };
  dev: boolean;
}

export const PluginDetails = ({ query, meta }: AppRootProps) => {
  const { slug } = query;
  const { pluginDir } = meta.jsonData as MarketplaceAppSettings;

  const [remotePlugin, setRemotePlugin] = useState<Plugin>();
  const [remoteVersions, setRemoteVersions] = useState([]);
  const [localPlugin, setLocalPlugin] = useState<Metadata>();

  const [tabs, setTabs] = useState([
    { label: 'Overview', active: true },
    { label: 'Version history', active: false },
  ]);

  const theme = useTheme();
  const styles = getStyles(theme);

  const refresh = useCallback(() => {
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
        setLocalPlugin(plugin);
      });
  }, [pluginDir, slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const description = remotePlugin?.description;
  const readme = remotePlugin?.readme;
  const version = localPlugin?.info?.version || remotePlugin?.version;
  const links = (localPlugin?.info?.links || remotePlugin?.json?.info?.links) ?? [];
  const downloads = remotePlugin?.downloads;
  const versions = remoteVersions;

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
            {links.map((link: any) => (
              <a href={link.url}>{link.name}</a>
            ))}
            {downloads && (
              <span>
                <Icon name="cloud-download" />
                {` ${new Intl.NumberFormat().format(downloads)}`}{' '}
              </span>
            )}
            {version && <span>{version}</span>}
          </div>
          <p>{description}</p>
          {remotePlugin && (
            <InstallControls
              localPlugin={localPlugin}
              remotePlugin={remotePlugin}
              slug={slug}
              pluginDir={pluginDir}
              onRefresh={refresh}
            />
          )}
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
          <div className={styles.readme} dangerouslySetInnerHTML={{ __html: readme ?? '' }}></div>
        )}
        {tabs.find(_ => _.label === 'Version history')?.active && <VersionList versions={versions} />}
      </TabContent>
    </>
  );
};

export const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    readme: css`
      margin: ${theme.spacing.lg} 0;

      & img {
        max-width: 100%;
      }

      h1,
      h2,
      h3 {
        margin-top: ${theme.spacing.lg};
        margin-bottom: ${theme.spacing.md};
      }

      li {
        margin-left: ${theme.spacing.md};
        & > p {
          margin: ${theme.spacing.sm} 0;
        }
      }
    `,
  };
});

interface VersionListProps {
  versions: Array<{ version: string; createdAt: string }>;
}

const VersionList = ({ versions }: VersionListProps) => {
  const theme = useTheme();

  return (
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
        {versions.map(version => {
          return (
            <tr>
              <td>{version.version}</td>
              <td>{dateTimeFormatTimeAgo(version.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

interface Props {
  localPlugin?: Metadata;
  remotePlugin: Plugin;

  slug: string;
  pluginDir?: string;

  onRefresh: () => void;
}

const InstallControls = ({ localPlugin, remotePlugin, slug, pluginDir, onRefresh }: Props) => {
  const [arch, setArch] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const theme = useTheme();

  const onInstall = (downloadUrl: string) => {
    setLoading(true);
    getBackendSrv()
      .post(
        `${API_ROOT}/install`,
        JSON.stringify({
          url: `https://grafana.com/api${downloadUrl}`,
          pluginDir,
        })
      )
      .finally(() => {
        setLoading(false);
        onRefresh();
      });
  };

  const onUpdate = () => {
    setLoading(true);
    getBackendSrv()
      .post(`${API_ROOT}/uninstall`, JSON.stringify({ slug, pluginDir }))
      .then(() => {
        getBackendSrv().post(
          `${API_ROOT}/install`,
          JSON.stringify({
            url: remotePlugin?.links.find(link => link.rel === 'download'),
            pluginDir,
          })
        );
      })
      .finally(() => {
        setLoading(false);
        onRefresh();
      });
  };

  const onUninstall = () => {
    setLoading(true);
    getBackendSrv()
      .post(`${API_ROOT}/uninstall`, JSON.stringify({ slug, pluginDir }))
      .finally(() => {
        setLoading(false);
        onRefresh();
      });
  };

  const isUpdateAvailable =
    remotePlugin?.version && localPlugin?.info.version && gt(remotePlugin?.version!, localPlugin?.info.version!);
  const grafanaDependency = remotePlugin?.json?.dependencies?.grafanaDependency;
  const unsupportedGrafanaVersion = grafanaDependency ? !satisfies(config.buildInfo.version, grafanaDependency) : false;

  const isDevelopmentBuild = !!localPlugin?.dev;
  const isEnterprise = remotePlugin?.status === 'enterprise';
  const isInternal = remotePlugin?.internal;
  const hasPackages = Object.keys(remotePlugin?.packages ?? {}).length > 1;
  const isInstalled = !!localPlugin;
  const defaultDownloadUrl = remotePlugin.links.find(_ => _.rel === 'download')?.href;

  const archOptions = Object.values(remotePlugin?.packages ?? {}).map(_ => ({
    label: _.packageName,
    value: _.packageName,
  }));

  const styles = {
    message: css`
      color: ${theme.colors.textSemiWeak};
    `,
    horizontalGroup: css`
      display: flex;

      & > * {
        margin-right: ${theme.spacing.sm};
      }

      & > *:last-child {
        margin-right: 0;
      }
    `,
  };

  if (isEnterprise) {
    return <div className={styles.message}>Enterprise plugins are currently not supported.</div>;
  }
  if (isInternal) {
    return <div className={styles.message}>This plugin is already included in Grafana.</div>;
  }
  if (isDevelopmentBuild) {
    return <div className={styles.message}>This is a development build of the plugin and can't be uninstalled.</div>;
  }

  if (isInstalled) {
    return (
      <div className={styles.horizontalGroup}>
        {isUpdateAvailable && (
          <Button disabled={loading} onClick={onUpdate}>
            {loading ? 'Updating' : 'Update'}
          </Button>
        )}
        <Button variant="destructive" disabled={loading} onClick={onUninstall}>
          {loading ? 'Uninstalling' : 'Uninstall'}
        </Button>
      </div>
    );
  }

  if (unsupportedGrafanaVersion) {
    return (
      <div className={styles.message}>
        <Icon name="exclamation-triangle" />
        &nbsp;This plugin doesn't support your version of Grafana.
      </div>
    );
  }

  if (hasPackages) {
    return (
      <div className={styles.horizontalGroup}>
        <Select
          width={25}
          placeholder="Select your architecture"
          options={archOptions}
          onChange={e => {
            setArch(e.value);
          }}
        />
        {arch && (
          <Button disabled={loading} onClick={() => onInstall(remotePlugin.packages[arch].downloadUrl)}>
            {loading ? 'Installing' : 'Install'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {defaultDownloadUrl ? (
        <Button disabled={loading} onClick={() => onInstall(defaultDownloadUrl)}>
          {loading ? 'Installing' : 'Install'}
        </Button>
      ) : null}
    </>
  );
};
