import { Handler } from "@netlify/functions";

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const USERNAME = process.env.DISCOGS_USERNAME;
const FOLDER_ID = 0; // Default folder (collection)

type DiscogsRelease = {
  id: number;
  basic_information: {
    title: string;
    year: number;
    artists: Array<{ name: string }>;
    labels: Array<{ name: string }>;
    formats: Array<{ name: string; descriptions?: string[] }>;
  };
}

export const handler: Handler = async (event) => {
  try {
    const count = Math.min(
      parseInt(event.queryStringParameters?.count || "1", 10),
      100 // Maximum limit
    );

    if (!USERNAME || !DISCOGS_TOKEN) {
      throw new Error("Missing Discogs configuration");
    }

    // Fetch collection
    const response = await fetch(
      `https://api.discogs.com/users/${USERNAME}/collection/folders/${FOLDER_ID}/releases?per_page=100`,
      {
        headers: {
          'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
          'User-Agent': 'DiscogsTrmnlRandom/0.1',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`);
    }

    const data = await response.json();
    const releases = data.releases as DiscogsRelease[];

    // Get random releases
    const randomReleases = [];
    const totalReleases = releases.length;
    const usedIndexes = new Set<number>();

    while (randomReleases.length < count && usedIndexes.size < totalReleases) {
      const randomIndex = Math.floor(Math.random() * totalReleases);
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        randomReleases.push(releases[randomIndex]);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count: randomReleases.length,
        releases: randomReleases.map(release => ({
          id: release.id,
          title: release.basic_information.title,
          year: release.basic_information.year,
          artists: release.basic_information.artists.map(a => a.name),
          labels: release.basic_information.labels.map(l => l.name),
          formats: release.basic_information.formats.map(f => ({
            name: f.name,
            descriptions: f.descriptions || []
          }))
        }))
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
}; 