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

describe('Random Release Handler', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('should return a single random release by default', async () => {
    const mockResponse = {
      pagination: { page: 1, pages: 1, per_page: 100, items: 1, urls: {} },
      releases: [{
        id: 123,
        basic_information: {
          title: 'Test Album',
          year: 2024,
          artists: [{ name: 'Test Artist' }],
          labels: [{ name: 'Test Label' }],
          formats: [{ name: 'Vinyl', descriptions: ['LP'] }]
        }
      }]
    };

    nock('https://api.discogs.com')
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, mockResponse);

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
    const mockResponse = {
      pagination: { page: 1, pages: 1, per_page: 100, items: 2, urls: {} },
      releases: [
        {
          id: 123,
          basic_information: {
            title: 'Vinyl Album',
            year: 2024,
            artists: [{ name: 'Test Artist' }],
            labels: [{ name: 'Test Label' }],
            formats: [{ name: 'Vinyl' }]
          }
        },
        {
          id: 456,
          basic_information: {
            title: 'CD Album',
            year: 2024,
            artists: [{ name: 'CD Artist' }],
            labels: [{ name: 'CD Label' }],
            formats: [{ name: 'CD' }]
          }
        }
      ]
    };

    nock('https://api.discogs.com')
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, mockResponse);

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
    nock('https://api.discogs.com')
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
    const mockResponse = {
      pagination: { page: 1, pages: 1, per_page: 100, items: 3, urls: {} },
      releases: Array(3).fill({
        id: 123,
        basic_information: {
          title: 'Test Album',
          year: 2024,
          artists: [{ name: 'Test Artist' }],
          labels: [{ name: 'Test Label' }],
          formats: [{ name: 'Vinyl' }]
        }
      })
    };

    nock('https://api.discogs.com')
      .get(`/users/${environment.DISCOGS_USERNAME}/collection/folders/0/releases`)
      .query(true)
      .reply(200, mockResponse);

    await LambdaTester(handler)
      .event(event({ queryStringParameters: { count: '2' } }))
      .expectResolve((result) => {
        const body = JSON.parse(result.body!);
        expect(result.statusCode).toBe(200);
        expect(body.count).toBe(2);
        expect(body.releases).toHaveLength(2);
      });
  });
}); 