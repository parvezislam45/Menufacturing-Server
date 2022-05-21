const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 7000;


// --------MiddleWire------------
app.use(cors())
app.use(express.json())


async function run(){
    try{

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