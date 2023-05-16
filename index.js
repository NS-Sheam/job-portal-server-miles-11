const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.k0vsmln.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const jobsCollection = client.db("jobPortal").collection("jobs");
    // Creating index on two fields
    const indexKeys = { title: 1, category: 1 }; // Replace field1 and field2 with your actual field names
    const indexOptions = { name: "titleCategory" }; // Replace index_name with the desired index name
    const result = await jobsCollection.createIndex(indexKeys, indexOptions);
    console.log(result);
    app.get("/allJobs", async (req, res) => {
      const query = req.query.email;
      if (query) {
        const filter = {postedBy : query};
        const jobs = await jobsCollection.find(filter).toArray();
        res.send(jobs);
        return;
      }
        const jobs = await jobsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
        res.send(jobs);
    });
    app.get("/singleJob/:id", async (req, res) => {
        console.log(req.params.id);
        const jobs = await jobsCollection.findOne({
            _id: new ObjectId(req.params.id),
        });
        res.send(jobs);
    });
    
    app.get("/myJobs/:email", async (req, res) => {
        console.log(req.params.id);
        const jobs = await jobsCollection
        .find({
            postedBy: req.params.email,
        })
        .toArray();
        res.send(jobs);
    });

    app.get("/allJobsByCategory/:category", async (req, res) => {
      const status = req.params.category;
      console.log(status);
      if(status == "all"){
        const jobs = await jobsCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
        console.log(jobs);
        res.send(jobs);
      }
      else{
        const jobs = await jobsCollection
        .find({
          status: req.params.category,
        })
        .toArray();
        res.send(jobs);
      }
    });

    app.post("/post-job", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      console.log(body);
      const result = await jobsCollection.insertOne(body);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again leter",
          status: false,
        });
      }
    });

    app.get("/getJobsByText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await jobsCollection
        .find({
          $or: [
            { title: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.put("/updateJob/:id", async (req, res) => {
        const id = req.params.id;
        const body = req.body;
        console.log(body);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                title: body.title,
                salary: body.salary,
                category: body.category,
            },
        };
        const result = await jobsCollection.updateOne(filter, updateDoc);
        res.send(result);
    });


    
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(5000, () => {
  console.log("server is running on port 5000");
});