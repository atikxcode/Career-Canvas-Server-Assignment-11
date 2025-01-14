const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vvsc5ct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollection = client.db('jobsite').collection('joblisted');
    

    app.post('/joblisted', async(req, res) => {
      const newJobPost = req.body;
      console.log(newJobPost);
      // res.header("Access-Control-Allow-Origin", "*");
      const result = await jobCollection.insertOne(newJobPost);
      res.send(result);
    })


    app.get('/joblisted', async(req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.delete('/joblisted/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobCollection.deleteOne(query);
      // res.header("Access-Control-Allow-Origin", "*");
      res.send(result);
    })



    app.get('/joblisted/:id', async(req, res) => {
      // const id = req.params.id;
      // const query = {_id: new ObjectId(id)}
      // const result = await jobCollection.findOne(query);
      // res.send(result);
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.findOne(query);
      res.send(result);
    })


    

   
    


    app.put('/joblisted/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert: true };
      const updateJobDetails = req.body;
      const Jobcard = {
        $set: {
          title: updateJobDetails.title,
          image: updateJobDetails.image,
          category: updateJobDetails.category,
          salaryRange: updateJobDetails.salaryRange,
          description: updateJobDetails.description,
          postingDate: updateJobDetails.postingDate,
          deadline: updateJobDetails.deadline,
          totalApplied: updateJobDetails.totalApplied
        }
      }
      
  
      const result = await jobCollection.updateOne(filter, Jobcard, options);
      // res.header("Access-Control-Allow-Origin", "*");
      res.send(result);
     })


     const appliedJobCollection = client.db('jobsite').collection('appliedjob');

     app.put('/joblisted/:id/apply', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};

      try{
        const jobListing = await jobCollection.findOne(filter);

        if(!jobListing){
          return res.status(404).send({success: false, message: 'Job listing not found'});

        }

        const deadlineDate = new Date(jobListing.deadline);
        const currentDate = new Date();
        if(currentDate > deadlineDate){
          return res.status(400).send({success: false, message: 'Deadline for applying has passed'});

        }

        const updatedTotalApplied = jobListing.totalApplied + 1;


        const result = await jobCollection.updateOne(filter, {$set: {totalApplied: updatedTotalApplied}});

        res.send({success: true, message: 'Applied Successfully', updatedTotalApplied});
        
        app.post('/appliedjob', async(req, res) => {
          const appliedJobs = req.body;
          console.log(appliedJobs);
          // res.header("Access-Control-Allow-Origin", "*");
          const result = await appliedJobCollection.insertOne(appliedJobs);
          res.send(result);
        })

      } catch (error) {
        console.error('Error applying to job: ', error);
        res.status(500).send({success: false, message: 'Internal server error'});
      }
     })


     

     app.get('/appliedjob', async(req, res) => {
      const cursor = appliedJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })




     

     app.get('/appliedjob/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await appliedJobCollection.findOne(query);
      res.send(result);
    })

    
    



   



    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Job Seeking Server');
})

app.listen(port, () => {
  console.log(`Job server is running on port: ${port}`);
})