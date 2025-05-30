export type Environment = {
  DISCOGS_TOKEN: string;
  DISCOGS_USERNAME: string;
}

export const environment: Environment = {
    DISCOGS_TOKEN: process.env.DISCOGS_TOKEN!,
    DISCOGS_USERNAME: process.env.DISCOGS_USERNAME!,
}; 