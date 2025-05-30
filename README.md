# Discogs Terminal Random

A Netlify function that returns random releases from your Discogs collection.

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Set up your Discogs credentials:
   - Get your Discogs API token from your [Discogs Settings](https://www.discogs.com/settings/developers)
   - Note your Discogs username

4. Configure environment variables using Netlify CLI:
```bash
npx netlify login
npx netlify link # If not already linked to your Netlify site
npx netlify env:set DISCOGS_TOKEN your_token_here
npx netlify env:set DISCOGS_USERNAME your_username_here
```

5. Deploy to Netlify:
   - Push to your connected Git repository, or
   - Run `npx netlify deploy`

## API Usage

### Get Random Releases

```bash
curl https://fanciful-jelly-2dffd0.netlify.app/random
```

### Get Random Releases with Format Filter

Query Parameters:
- `count` (optional): Number of random releases to return (default: 1, max: 100)
- `format` (optional): Filter by format (e.g., "Vinyl", "CD", "Cassette")

```bash
curl https://fanciful-jelly-2dffd0.netlify.app/random?format=vinyl
```

Response:
```json
{
  "count": 2,
  "releases": [
    {
      "id": 2416518,
      "title": "Masters",
      "year": 1986,
      "artists": [
        "Juice Leskinen"
      ],
      "labels": [
        "Amulet"
      ],
      "formats": [
        {
          "name": "Vinyl",
          "descriptions": [
            "LP",
            "Compilation"
          ]
        }
      ],
      "thumb": "https://i.discogs.com/slOWA0BdNhsE9CxM04_0DajsLGDDp-4VyCksifPQ-Xg/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTI0MTY1/MTgtMTQ4MzkwMDA2/Ny03MDc2LmpwZWc.jpeg",
      "cover_image": "https://i.discogs.com/rLZ2_pdaDlll-a5sHp2VrJqmaHF9-7OYgDPR1mP41qw/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTI0MTY1/MTgtMTQ4MzkwMDA2/Ny03MDc2LmpwZWc.jpeg"
    },
    {
      "id": 21308377,
      "title": "Rockin' Live 1982",
      "year": 2021,
      "artists": [
        "Hurriganes"
      ],
      "labels": [
        "Emsalö Music"
      ],
      "formats": [
        {
          "name": "Vinyl",
          "descriptions": [
            "LP",
            "Album",
            "Limited Edition"
          ]
        }
      ],
      "thumb": "https://i.discogs.com/sTb4QXVNpx9NqIfK72bCMJ8eBJvlPRl_O_eOviJ-qZo/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTIxMzA4/Mzc3LTE2Mzk0NjY0/NTEtMzg1Ny5qcGVn.jpeg",
      "cover_image": "https://i.discogs.com/_gGEXTReH4kER1rEjnazoJWlVtlYYbpUjhRJ56LmjIo/rs:fit/g:sm/q:90/h:600/w:597/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTIxMzA4/Mzc3LTE2Mzk0NjY0/NTEtMzg1Ny5qcGVn.jpeg"
    }
  ]
}
```

## Development

To run locally:
```bash
npm run dev
```

This will start the Netlify development server at `http://localhost:8888`.
