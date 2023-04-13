import express,{json} from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";

const app = express();
const PORT = 5000;
app.use(json());
app.use(cors());
dotenv.config();

let db
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((err) => console.log(err.message))


app.listen(PORT, ()=>{console.log(`Server online in port: ${PORT}`)})