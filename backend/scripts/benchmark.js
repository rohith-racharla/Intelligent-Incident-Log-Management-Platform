'use strict'

const autocannon = require('autocannon')
const { join } = require('path')

const duration = 10 // seconds
const url = 'http://localhost:3000/ingest'

console.log(`Starting benchmark against ${url} for ${duration} seconds...`)

const instance = autocannon({
  url,
  connections: 100, // Number of concurrent connections
  pipelining: 1, // Number of pipelined requests
  duration,
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    service_id: 'benchmark-service',
    level: 'INFO',
    message: 'Benchmark log entry for throughput testing',
    timestamp: new Date().toISOString(),
    metadata: {
      load_test: true
    }
  })
}, (err, result) => {
  if (err) {
    console.error(err)
    return
  }

  console.log('Benchmark complete!')
  console.log('------------------------------------------------')
  console.log(`Title:          Intelligent Ingestion Benchmark`)
  console.log(`Duration:       ${result.duration}s`)
  console.log(`Connections:    ${result.connections}`)
  console.log(`Requests/Sec:   ${result.requests.average}`)
  console.log(`Latency (Avg):  ${result.latency.average}ms`)
  console.log(`Throughput:     ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`)
  console.log('------------------------------------------------')
  
  if (result.non2xx > 0) {
    console.warn(`WARNING: ${result.non2xx} requests failed (non-2xx response).`)
  }
})

autocannon.track(instance, { renderProgressBar: true })
