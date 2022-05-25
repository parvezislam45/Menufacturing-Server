const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 7000;

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
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
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
    const reviewCollection = client
      .db("reviewCollection")
      .collection("collection");

    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    });

    // ----------- All User -----------------

    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
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
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
    //API to update a user
    app.put("/update/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      console.log("user", user);
      const query = {
        email: email,
      };
      const options = {
        upsert: true,
      };
      const updatedDoc = {
        $set: {
          displayName: user?.displayName,
          institution: user?.institution,
          phoneNumber: user?.phoneNumber,
          address: user?.address,
          dateOfBirth: user?.dateOfBirth,
        },
      };
      const result = await usersCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

     //API to remove admin
     app.delete("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await adminsCollection.deleteOne(filter);
      res.send(result);
    }
    );

     //API to update a order
     app.put("/orders/:id", async (req, res) => {
      const orderId = req.params.id;
      const order = req.body; 
      console.log("order", order);
      const query = { _id: ObjectId(orderId) };
      const options = { upsert: true };
      const updatedOrder = await ordersCollection.updateOne(
        query,
        {
          $set: order,
        },
        options
      );
      res.send(updatedOrder);
    });

     //API to get orders by user email
     app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const orders = await ordersCollection
        .find({ userEmail: email })
        .toArray();
      res.send(orders);
    });
    //API to get orders with multiple query parameters
    app.get("/orders/:email/:isdelivered", async (req, res) => {
      const email = req.params.email;
      const isdelivered = req.params.isdelivered;
      const orders = await ordersCollection
        .find({ userEmail: email, isDelivered: true })
        .toArray();
      res.send(orders);
    });

    //API to add a order
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    //API to delete a order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      console.log("id", id);
      const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });


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
