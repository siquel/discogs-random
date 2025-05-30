import LambdaTester from 'lambda-tester';
import nock from 'nock';
import { handler } from './random';
import { HandlerEvent } from '@netlify/functions';
import { environment } from '../environment';
const event = (event?: Partial<HandlerEvent>): HandlerEvent =>  {
    return {
      rawUrl: event?.rawUrl || "",
      rawQuery: event?.rawQuery || "",
      path: event?.path || "",
      httpMethod: event?.httpMethod || "GET",
      headers: event?.headers || {},
      multiValueHeaders: event?.multiValueHeaders || {},
      queryStringParameters: event?.queryStringParameters || null,
      multiValueQueryStringParameters: event?.multiValueQueryStringParameters || null,
      body: event?.body || "",
      isBase64Encoded: event?.isBase64Encoded || false,
    };
};

const createTestPageResponse = ({
  pages,
}: {
  pages: Array<Array<{
    title: string;
    format: string;
    description?: string[];
  }>>;
}) => {
  const totalItems = pages.reduce((sum, page) => sum + page.length, 0);
  const perPage = pages[0].length;
  
  return pages.map((releases, pageIndex) => ({
    pagination: {
      page: pageIndex + 1,
      pages: pages.length,
      per_page: perPage,
      items: totalItems,
      ...(pageIndex === pages.length - 1 ? { urls: {} } : {})
    },
    releases: releases.map((release, releaseIndex) => ({
      id: pageIndex * perPage + releaseIndex + 1,
      basic_information: {
        title: release.title,
        year: 2024,
        artists: [{ name: `Artist ${pageIndex * perPage + releaseIndex + 1}` }],
        labels: [{ name: `Label ${pageIndex * perPage + releaseIndex + 1}` }],
        formats: [{
          name: release.format,
          ...(release.description ? { descriptions: release.description } : {})
        }]
      }
    }))
  }));
};

describe('Random Release Handler', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('should return a single random release by default', async () => {
    const responses = createTestPageResponse({
      pages: [[
        { title: 'Test Album', format: 'Vinyl', description: ['LP'] }
      ]]
    });

    nock(environment.DISCOGS_API_HOST)
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[0]);

    await LambdaTester(handler)
      .event(event({ queryStringParameters: { format: 'vinyl' } }))
      .expectResolve((result) => {
        const body = JSON.parse(result.body!);
        expect(result.statusCode).toBe(200);
        expect(body.count).toBe(1);
        expect(body.releases).toHaveLength(1);
        expect(body.releases[0].title).toBe('Test Album');
      });
  });

  it('should filter by format correctly', async () => {
    const responses = createTestPageResponse({
      pages: [[
        { title: 'Vinyl Album', format: 'Vinyl' },
        { title: 'CD Album', format: 'CD' }
      ]]
    });

    nock(environment.DISCOGS_API_HOST)
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[0]);

    await LambdaTester(handler)
      .event(event({ queryStringParameters: { format: 'vinyl' }}))
      .expectResolve((result) => {
        const body = JSON.parse(result.body!);
        expect(result.statusCode).toBe(200);
        expect(body.releases).toHaveLength(1);
        expect(body.releases[0].formats[0].name).toBe('Vinyl');
      });
  });

  it('should handle API errors correctly', async () => {
    nock(environment.DISCOGS_API_HOST)
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(404, { message: 'Not Found' });

    await LambdaTester(handler)
      .event(event({ queryStringParameters: {} }))
      .expectResolve((result) => {
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body!).message).toBe('Discogs API error: Not Found');
      });
  });

  it('should respect the count parameter', async () => {
    const responses = createTestPageResponse({
      pages: [[
        { title: 'Test Album 1', format: 'Vinyl' },
        { title: 'Test Album 2', format: 'Vinyl' },
        { title: 'Test Album 3', format: 'Vinyl' }
      ]]
    });

    nock(environment.DISCOGS_API_HOST)
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[0]);

    await LambdaTester(handler)
      .event(event({ queryStringParameters: { count: '2' } }))
      .expectResolve((result) => {
        const body = JSON.parse(result.body!);
        expect(result.statusCode).toBe(200);
        expect(body.count).toBe(2);
        expect(body.releases).toHaveLength(2);
      });
  });

  it('should handle multiple pages of mixed formats', async () => {
    const responses = createTestPageResponse({
      pages: [
        [
          { title: 'CD Album', format: 'CD' },
          { title: 'CD Album 2', format: 'CD' }
        ],
        [
          { title: 'Vinyl Album 2', format: 'Vinyl' },
          { title: 'Vinyl Album 3', format: 'Vinyl' }
        ],
        [
          { title: 'Vinyl Album 4', format: 'Vinyl' },
          { title: 'Digital Album 1', format: 'Digital', description: ['MP3'] }
        ],
        [
          { title: 'Digital Album 2', format: 'Digital', description: ['MP3'] },
          { title: 'Digital Album 3', format: 'Digital', description: ['MP3'] }
        ]
      ]
    });

    // Mock all four pages
    nock(environment.DISCOGS_API_HOST)
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[0])
      // Page 2
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[1])
      // Page 3
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[2])
      // Page 4
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, responses[3]);

    // Test filtering by vinyl format
    await LambdaTester(handler)
      .event(event({ queryStringParameters: { format: 'vinyl', count: '10' } }))
      .expectResolve((result) => {
        const body = JSON.parse(result.body!);
        expect(result.statusCode).toBe(200);
        expect(body.releases.length).toBe(3);
        body.releases.forEach((release: any) => {
          expect(release.formats[0].name).toBe('Vinyl');
        });
      });
  });
}); 