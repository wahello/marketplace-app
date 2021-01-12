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
  versionSignatureType: string;
};
