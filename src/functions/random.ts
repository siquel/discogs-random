import { Handler } from "@netlify/functions";

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const USERNAME = process.env.DISCOGS_USERNAME;
const FOLDER_ID = 0; // Default folder (collection)
const APP_VERSION = '0.1';
const USER_AGENT = `DiscogsTrmnlRandom/${APP_VERSION}`;

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

type DiscogsResponse = {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      next?: string;
      last?: string;
    };
  };
  releases: DiscogsRelease[];
}

export const handler: Handler = async (event) => {
  try {
    const count = Math.min(
      parseInt(event.queryStringParameters?.count || "1", 10),
      100 // Maximum limit
    );
    const format = event.queryStringParameters?.format;

    if (!USERNAME || !DISCOGS_TOKEN) {
      throw new Error("Missing Discogs configuration");
    }

    // Fetch all pages
    let allReleases: DiscogsRelease[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '100',
      });
      
      if (format) {
        queryParams.append('format', format);
        queryParams.append('sort', 'format');
      }

      const response = await fetch(
        `https://api.discogs.com/users/${USERNAME}/collection/folders/${FOLDER_ID}/releases?${queryParams}`,
        {
          headers: {
            'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
            'User-Agent': USER_AGENT,
          }
        }
      );

      console.log(response)

      if (!response.ok) {
        throw new Error(`Discogs API error: ${response.statusText}`);
      }

      const data = await response.json() as DiscogsResponse;

      // Filter releases if format is specified
      const filteredReleases = format
        ? data.releases.filter(release =>
            release.basic_information.formats.some(f => 
              f.name.toLowerCase() === format.toLowerCase()
            )
          )
        : data.releases;

      allReleases = [...allReleases, ...filteredReleases];
      
      totalPages = data.pagination.pages;
      currentPage++;
    } while (currentPage <= totalPages);

    // Get random releases
    const randomReleases = [];
    const totalReleases = allReleases.length;
    const usedIndexes = new Set<number>();

    while (randomReleases.length < count && usedIndexes.size < totalReleases) {
      const randomIndex = Math.floor(Math.random() * totalReleases);
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        randomReleases.push(allReleases[randomIndex]);
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