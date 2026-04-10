import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  console.warn("MONGODB_URI environment variable is missing.");
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

app.get('/api/projects', async (req, res) => {
  if (!clientPromise) return res.status(500).json({ error: 'Database connection missing' });
  try {
    const database = (await clientPromise).db();
    const projects = await database.collection('projects').find({}).toArray();
    // Normalize id
    const mappedProjects = projects.map(p => ({
        ...p,
        id: p.id || p._id.toString()
    }));
    res.json(mappedProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  if (!clientPromise) return res.status(500).json({ error: 'Database connection missing' });
  try {
    const database = (await clientPromise).db();
    const project = req.body;
    const result = await database.collection('projects').insertOne(project);
    res.json({ ...project, _id: result.insertedId, id: project.id || result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  if (!clientPromise) return res.status(500).json({ error: 'Database connection missing' });
  try {
    const { id } = req.params;
    const database = (await clientPromise).db();
    
    // Delete by custom ID or stringified ObjectId
    let filter = { id: id };
    if (id.length === 24) {
      // It might be an ObjectId
      filter = { $or: [{ id: id }, { _id: new ObjectId(id) }] };
    }

    await database.collection('projects').deleteOne(filter);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Express API running on port ${PORT}`);
  });
}

export default app;
