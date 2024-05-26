const { setupTracing } = require('./tracing');
const api = require("@opentelemetry/api");
const fs = require('fs');

const tracer = setupTracing('mongodb');

const { MongoClient } = require('mongodb');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const uri = 'mongodb+srv://admin:123456@rs-0-svc.mongodb.svc.cluster.local';
const ca = fs.readFileSync(`/app/ca.pem`);
const cert = fs.readFileSync(`/app/client.pem`);
const key = fs.readFileSync(`/app/client.key`);

// for local mode
//const uri = 'mongodb://admin:123456@localhost:27017/admin?directConnection=true';
//const ca = fs.readFileSync(`./ca/ca.pem`);
//const cert = fs.readFileSync(`./ca/client.pem`);
//const key = fs.readFileSync(`./ca/client.key`);

const client = new MongoClient(uri, { 
  tls: true, ca, cert, key,
  monitorCommands: true
});

let commandSpanMap = {};
client.on('commandStarted', (event) => {

  const parentSpan = api.trace.getSpan(api.context.active());
  if(!parentSpan) return;

  commandSpan = tracer.startSpan(`MongoDB - commandStarted`, {
    parent: parentSpan,
  });

  Object.entries(event).forEach(([key, value]) => {
    if(typeof value === 'object'){
      value = JSON.stringify(value);
    }
    commandSpan.setAttribute(key, value);
  });
  
  commandSpanMap[event.requestId] = commandSpan;
})

client.on('commandSucceeded', (event) => {
  if(!commandSpanMap[event.requestId]) return;
  commandSpanMap[event.requestId].end();
  delete commandSpanMap[event.requestId];
})

client.on('commandFailed', (event) => {
  if(!commandSpanMap[event.requestId]) return;
  commandSpanMap[event.requestId].end();
  delete commandSpanMap[event.requestId];
})

async function main() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    app.post('/', async (req, res) => {
      const span = tracer.startSpan('New Request');
      try {
        const data = req.body;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON payload');
        }
        
        const database = client.db(data.database);
        const collection = database.collection(data.collection);

        let result = await collection[data.operation](data.data);

        if(['find', 'aggregate'].includes(data.operation)){
          result = await result.toArray();
        }
        
        return res.status(200).json(result);

      } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
      } finally {
        span.end();
      }
    });

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
