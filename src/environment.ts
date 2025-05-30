export type Environment = {
  DISCOGS_TOKEN: string;
  DISCOGS_USERNAME: string;
  DISCOGS_API_HOST: string;
}

export const environment: Environment = {
    DISCOGS_TOKEN: process.env.DISCOGS_TOKEN!,
    DISCOGS_USERNAME: process.env.DISCOGS_USERNAME!,
    DISCOGS_API_HOST: 'https://api.discogs.com'
}; 