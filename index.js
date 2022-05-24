const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 7000;


// --------MiddleWire------------
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xjbqm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// --------------JWT Function ---------------
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }


async function run(){
    try{
        await client.connect();
        const productCollection = client.db('pertsCollection').collection('collection')
        const orderCollection = client.db('pertsCollection').collection('orderCollection')
        const userCollection = client.db('pertsCollection').collection('user')
        const reviewCollection = client.db('reviewCollection').collection('collection')


        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // ----------- All User -----------------

        app.get('/user',async (req,res)=>{
            const users = await userCollection.find().toArray()
            res.send(users)
        })

        app.put('/user/admin/:email',verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
          if(email === decodedEmail){
            const filter = { email: email };
            const updateDoc = {
              $set: {role: 'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
          }
          else{
            res.send("Unauthorized access");
          }
            
          })

        // ------------------ Upsert User----------------------

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESs_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({result,token});
          })

        // ------------ Use Info -----------------
        app.get('/order/:email',async (req,res) =>{
            const email = req.params.email;
            const query = {email: email};
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        })


        // // ---------------- Update Quantity ----------------------
        // app.put('/product/:id', async (req, res) => {
        //     const id = req.params.id
        //     const updateProduct = req.body
        //     console.log(updateProduct);
        //     const query = { _id: ObjectId(id) }
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             availableQuantity: updateProduct.newQuantity
        //         }
        //     }

        //     const result = await productCollection.updateOne(query, updateDoc, options)
        //     res.send(result)
        // })


                // -------- Order Data---------

                app.post('/order',async (req, res)=>{
                    const orders = req.body;
                    const result = await orderCollection.insertOne(orders);
                    res.send(result);
                })

    }
    finally{

    }
}
run().catch(console.dir)
app.get('/',(req,res)=>{
    res.send('Alhamdulliah Your server is Running')
})
app.listen(port,()=>{
    console.log('Alhamdullilah Your server is Start')
})