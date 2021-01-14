export interface MarketplaceAppSettings {
  pluginDir?: string;
  showUnsigned?: boolean;
}

export type Plugin = {
  name: string;
  description: string;
  slug: string;
  orgName: string;
  orgSlug: string;
  signatureType: string;
  version: string;
  status: string;
  popularity: number;
  downloads: number;
  updatedAt: string;
  createdAt: string;
  typeCode: string;
  featured: number;
  readme: string;
  internal: boolean;
  versionSignatureType: string;
  packages: {
    [arch: string]: {
      packageName: string;
      downloadUrl: string;
    };
  };
  links: {
    rel: string;
    href: string;
  }[];
  json: {
    dependencies: {
      grafanaDependency: string;
      grafanaVersion: string;
    };
    info: {
      links: {
        name: string;
        url: string;
      }[];
    };
  };
};
