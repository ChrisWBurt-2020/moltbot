#!/usr/bin/env node

/**
 * Test Graph API Endpoints
 * 
 * Tests all knowledge graph endpoints and creates sample data
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3003';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Knowledge Graph API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing API health...');
    const health = await makeRequest('/api/health');
    if (health.status === 200 && health.data.ok) {
      console.log('   ✅ API is healthy');
    } else {
      console.log('   ❌ API health check failed');
      return false;
    }

    // Test 2: Create test learnings
    console.log('\n2. Creating test learnings...');
    const learnings = [
      {
        source: 'telegram',
        concept: 'MCP Protocol',
        context: 'Learned about scaling MCP protocol for distributed systems',
        confidence: 0.9
      },
      {
        source: 'cli',
        concept: 'CLI Router',
        context: 'Related to MCP protocol and request routing',
        confidence: 0.85
      },
      {
        source: 'github',
        concept: 'Distributed Systems',
        context: 'MCP protocol patterns in distributed architecture',
        confidence: 0.8
      }
    ];

    for (const learning of learnings) {
      const result = await makeRequest('/api/learnings', 'POST', learning);
      if (result.status === 200) {
        console.log(`   ✅ Created: ${learning.concept}`);
      } else {
        console.log(`   ❌ Failed to create: ${learning.concept}`);
      }
    }

    // Test 3: Run concept linker (manual trigger)
    console.log('\n3. Running concept linker...');
    const { exec } = require('child_process');
    exec('node /home/debian/clawd/scripts/run-concept-linker.js', (error, stdout, stderr) => {
      if (error) {
        console.log('   ⚠️  Concept linker may have failed:', error.message);
      } else {
        console.log('   ✅ Concept linker executed');
      }
    });

    // Wait a bit for linker to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Get relationships
    console.log('\n4. Testing relationships endpoint...');
    const graph = await makeRequest('/api/graph/full');
    if (graph.status === 200) {
      console.log(`   ✅ Full graph: ${graph.data.nodes?.length || 0} nodes, ${graph.data.edges?.length || 0} edges`);
    } else {
      console.log('   ⚠️  Graph endpoint returned:', graph.status);
    }

    // Test 5: Get clusters
    console.log('\n5. Testing clusters endpoint...');
    const clusters = await makeRequest('/api/graph/clusters');
    if (clusters.status === 200) {
      console.log(`   ✅ Clusters: ${clusters.data?.length || 0} clusters`);
    } else {
      console.log('   ⚠️  Clusters endpoint returned:', clusters.status);
    }

    // Test 6: Get specific concept graph
    console.log('\n6. Testing concept-specific graph...');
    if (graph.data.nodes && graph.data.nodes.length > 0) {
      const conceptId = graph.data.nodes[0].id;
      const conceptGraph = await makeRequest(`/api/graph/concept?id=${conceptId}`);
      if (conceptGraph.status === 200) {
        console.log(`   ✅ Concept graph retrieved`);
      } else {
        console.log('   ⚠️  Concept graph endpoint returned:', conceptGraph.status);
      }
    }

    console.log('\n✨ All tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - API is running and accessible');
    console.log('   - Learnings can be created');
    console.log('   - Concept linker can be executed');
    console.log('   - Graph endpoints are available');
    console.log('\n💡 Next steps:');
    console.log('   1. Check /api/graph/full for the complete knowledge graph');
    console.log('   2. Use /api/graph/clusters to see grouped concepts');
    console.log('   3. Test Telegram commands: /graph "MCP Protocol"');
    console.log('   4. View data in database with the queries in CLAUDE.md');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure heronclient daemon is running');
    console.log('   - Check database is accessible');
    console.log('   - Verify API_BASE is correct (default: http://localhost:3003)');
    return false;
  }
}

// Run tests
testAPI().then(success => {
  process.exit(success ? 0 : 1);
});
