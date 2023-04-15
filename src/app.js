import express,{json} from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";

const app = express();
const PORT = 5000;
const print = (value) => console.log(value);
app.use(json());
app.use(cors());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);

try{
	await mongoClient.connect();
}catch(err){
	print(err.message);
}

const db = mongoClient.db();

app.post("/participants", async(req, res) =>{
	const nameSchema = joi.object({
		name: joi.string().min(3).max(30).required()
	});
	const {name} = req.body;
	const validation = nameSchema.validate({name});

	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}
	try{
		const nameDuplicated = await db.collection("participants").findOne({name:name});

		if (nameDuplicated) return res.status(409).send("Esse nome já está em uso");

		await db.collection("participants").insertOne({name, lastStatus: Date.now()});

		await db.collection("messages").insertOne({ 
			from: name, 
			to: "Todos", 
			text: "entra na sala...", 
			type: "status", 
			time: dayjs().format("HH:mm:ss") });

		res.sendStatus(201);

	}catch(err){
		res.status(500).send(err.message);
	}
});

app.get("/participants", async(req, res)=>{
	try{
		const participants = await db.collection("participants").find().toArray();
		res.send(participants);
	}catch(err){
		res.status(500).send(err.message);
	}
});

app.post("/messages", async(req, res)=>{
	const messageSchema = joi.object({
		to: joi.string().min(3).max(30).required(),
		text: joi.string().required(),
		type: joi.string().required().valid("private").valid("private_message")
	});
	const {user} = req.headers;
	const {to, text, type} = req.body;
	const validation = messageSchema.validate(req.body);

	if(!user){
		return res.status(422).send("Necessário envio de Usuário pelo Header");
	}

	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}
	try{
		const existUser = await db.collection("participants").findOne({name:user});
		print(existUser);
		print(user);
		if (!existUser) return res.status(404).send("Usuário não encontrado");
		await db.collection("messages").insertOne({
			from: user,
			to,
			text,
			type, 
			time: dayjs().format("HH:mm:ss")
		});
		res.sendStatus(201);
	}catch(err){
		res.status(500).send(err.message);
	}
	
});

app.listen(PORT, ()=>print(`Server online in port: ${PORT}`));