const { test, expect } = require('@playwright/test');

test.describe('Exocortex Backend API', () => {
  const BASE_URL = 'http://127.0.0.1:3003';

  test('learning creation endpoint', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/learnings`, {
      data: {
        source: 'test',
        concept: 'Test Concept from API',
        context: 'Testing the learning endpoint',
        confidence: 0.85
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.concept).toBe('Test Concept from API');
  });

  test('learning retrieval endpoint', async ({ request }) => {
    // First create a learning
    const createResponse = await request.post(`${BASE_URL}/api/learnings`, {
      data: {
        source: 'test-retrieval',
        concept: 'Retrieval Test',
        context: 'Testing retrieval'
      }
    });
    const created = await createResponse.json();

    // Now retrieve it
    const getResponse = await request.get(
      `${BASE_URL}/api/learnings/${created.data.id}`
    );

    expect(getResponse.ok()).toBeTruthy();
    const data = await getResponse.json();
    expect(data.id).toBe(created.data.id);
    expect(data.concept).toBe('Retrieval Test');
  });

  test('graph full endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/graph/full`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.nodes).toBeDefined();
    expect(data.edges).toBeDefined();
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
  });

  test('graph clusters endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/graph/clusters`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('daily insights endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/daily/insights`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('health check endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('cross-source learning pattern', async ({ request }) => {
    // Create learning from telegram
    await request.post(`${BASE_URL}/api/learnings`, {
      data: {
        source: 'telegram',
        concept: 'Cross-Source Pattern Test',
        context: 'Learned from Telegram'
      }
    });

    // Create same concept from CLI
    await request.post(`${BASE_URL}/api/learnings`, {
      data: {
        source: 'cli',
        concept: 'Cross-Source Pattern Test',
        context: 'Learned from CLI'
      }
    });

    // Wait for concept linker to run (or manually trigger)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check graph for relationships
    const graphResponse = await request.get(`${BASE_URL}/api/graph/full`);
    const graph = await graphResponse.json();

    // Should have concept with multiple sources
    const concept = graph.nodes.find(n => 
      n.concept === 'Cross-Source Pattern Test'
    );
    
    expect(concept).toBeDefined();
    expect(concept.source).toBeDefined();
  });
});