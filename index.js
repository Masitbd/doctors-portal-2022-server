const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorize access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "forbidden access" });
    }
    ///console.log(decoded); // bar

    req.decoded = decoded;
    next;
  });
}

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
    const userConnection = client.db("doctors-portal").collection("users");
    const doctorConnection = client.db("doctors-portal").collection("doctors");

    //console.log(serviceConnection);

    app.get("/users", async (req, res) => {
      const users = await userConnection.find().toArray();
      res.send(users);
    });

    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { eamil: email };
      const updateDoc = {
        $set: user,
      };
      const result = await userConnection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { eamil: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userConnection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    // get data

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceConnection.find(query).project({ name: 1 });
      const services = await cursor.toArray();
      //console.log(services);
      res.send(services);
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date;

      //step 1: get all services

      const services = await serviceConnection.find().toArray();

      // step 2: get the booking of that day
      const quary = { date: date };
      const bookings = await bookingConnection.find(quary).toArray();

      // step 3: for each service find booking of that service
      services.forEach((service) => {
        const serviceBookings = bookings.filter(
          (b) => b.treatment === service.name
        );
        const booked = serviceBookings.map((s) => s.slot);
        // service.booked = booked;

        const available = service.slots.filter((s) => !booked.includes(s));
        service.slots = available;
      });
      res.send(services);
    });

    app.get("/booking", verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const query = { patient: patient };
        const bookings = await bookingConnection.find(query).toArray();
        console.log(query);
        res.send(bookings);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/doctor", async (req, res) => {
      const doctors = await doctorConnection.find().toArray();
      res.send(doctors);
    });

    // delete doctor
    app.delete("/doctor/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await doctorConnection.deleteOne(filter);
      res.send(result);
    });

    // post data

    app.post("/doctor", async (req, res) => {
      const doctor = req.body;
      const result = await doctorConnection.insertOne(doctor);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      console.log(query);
      const exists = await bookingConnection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingConnection.insertOne(booking);
      res.send({ success: true, result });
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
