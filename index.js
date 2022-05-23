const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 7000;


// --------MiddleWire------------
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xjbqm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run(){
    try{
        await client.connect();
        const productCollection = client.db('pertsCollection').collection('collection')
        const orderCollection = client.db('orderCollection').collection('collection')
        const userCollection = client.db('userCollection').collection('collection')
        const reviewCollection = client.db('reviewCollection').collection('collection')


        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        
                //------------ API to get product by id--------
                
                app.get("/product/:id", async (req, res) => {
                    const id = req.params.id;
                    const tool = await productCollection.findOne({ _id: ObjectId(id) });
                    res.send(tool);
                });

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