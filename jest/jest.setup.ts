import nock from 'nock';

// Disable real HTTP requests during tests
nock.disableNetConnect();

// Mock environment variables
process.env.DISCOGS_TOKEN = 'test-token';
process.env.DISCOGS_USERNAME = 'test-user';

// Clean up after all tests
afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect(); 
});