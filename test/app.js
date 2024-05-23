const { setupTracing } = require('./tracing');
const fs = require('fs');

const serviceName = 'my-mongodb';
const tracer = setupTracing(serviceName);

const { MongoClient } = require('mongodb');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const uri = 'mongodb+srv://admin:123456@rs-0-svc.mongodb.svc.cluster.local';

const ca = fs.readFileSync(`/app/ca.pem`);
const cert = fs.readFileSync(`/app/client.pem`);
const key = fs.readFileSync(`/app/client.key`);

tracer.startSpan('open connection');
const client = new MongoClient(uri, { tls: true, ca, cert, key });

async function main() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('mydatabase');
    const collection = database.collection('mycollection');

    app.post('/', async (req, res) => {
      const span = tracer.startSpan('makeRequest');
      try {
        const data = req.body;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON payload');
        }
        const documents = await collection.find(data).toArray();
        res.send(JSON.stringify(documents));
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
