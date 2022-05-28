const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 7000;
console.log(process.env.STRIPE_SECRET_KEY)
// --------MiddleWire------------
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xjbqm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// --------------JWT Function ---------------
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    // if (err) {
    //   return res.status(403).send({ message: "Forbidden access" });
    // }
    req.decoded = decoded;
    next();
    console.log(authHeader)
  });
  
}

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("pertsCollection")
      .collection("collection");
    const orderCollection = client
      .db("pertsCollection")
      .collection("orderCollection");
    const userCollection = client.db("pertsCollection").collection("user");
    const reviewCollection = client.db("reviewCollection").collection("review");
    const profileCollection = client.db("reviewCollection").collection("info");

    // ----------------------- All Product -----------------

    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.sort({ _id: -1 }).limit(6).toArray();
      res.send(products);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    });
    app.patch('/product/:id',async(req,res)=>{
      const id = req.params.id;
      const quantity=req.body
      const filter = {_id: ObjectId(id)}
      const updateDoc = {
        $set:{
          stock:quantity.restQuantity
        }
      }
      const updateQuantity=await productCollection.updateOne(filter,updateDoc);
      res.send(updateQuantity);
    })

    app.post('/product',async (req,res) =>{
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
  })

    // ----------- All User -----------------

    app.get("/user",verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });

    // ------------------ Upsert User----------------------

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESs_TOKEN_SECRET,
        { expiresIn: "5h" }
      );
      res.send({ result, token });
    });

    //API to add a order
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const productId = order.orderId;
      const product = await productCollection .findOne({
        _id: ObjectId(productId),
      });
      let qtn = parseInt(product?.quantity) - parseInt(order?.quantity);

      await productCollection.updateOne({ _id: ObjectId(productId) }, { $set: { quantity: qtn } });
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const users = await orderCollection.find().toArray();
      res.send(users);
    });
    app.get("/orders/:id", async (req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const orders = await orderCollection.findOne(query);
      res.send(orders)
    })
    app.get("/orders/user/:email", async (req, res) => {
      const email=req.params.email
      const query={email:email}
      const users = await orderCollection.find(query).toArray();
      res.send(users);
    });

    app.patch('/orders/:id',async (req,res)=>{
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
          $set: {
              paid: true,
              transactionId: payment.transactionId
          }
      }
      const updatedBooking = await orderCollection.updateOne(filter, updatedDoc);
      res.send(updatedBooking);
    })


    // ---------------- Delate Order ------------------

    app.delete('/orders/:id',async (req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.send(result);
  })

    // -------------- Review Collection ---------------

    app.post("/review", async (req, res) => {
      const order = req.body;
      const result = await reviewCollection.insertOne(order);
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const review = await reviewCollection.find().toArray();
      res.send(review);
    });

    // -------------------Update User Info--------------------

    app.put("/info", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await profileCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/info/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const info = await profileCollection.findOne({ email: email });
      res.send(info);
    });

    // -----------------------Paymnt-------------------

    app.post('/create-payment-intent' ,async (req, res) =>{
      const service = req.body;
      const price = service.price;
      if(price){ const amount = price*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount : amount,
          currency: 'usd',
          payment_method_types:['card']
        });
        res.send({clientSecret: paymentIntent.client_secret})}
        else{
          res.send({clientSecret: ''})
        }
     
    });

    // ----------- Final------------

  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Alhamdulliah Your server is Running");
});
app.listen(port, () => {
  console.log("Alhamdullilah Your server is Start");
});
