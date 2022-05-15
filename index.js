const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x3tpd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // console.log("Database is connected");
    const serviceConnection = client
      .db("doctors-portal")
      .collection("services");
    const bookingConnection = client
      .db("doctors-portal")
      .collection("bookings");

    //console.log(serviceConnection);

    // get data

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceConnection.find(query);
      const services = await cursor.toArray();
      //console.log(services);
      res.send(services);
    });

    // post data

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingConnection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingConnection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Doctors uncle!");
});

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`);
});
