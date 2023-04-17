import express,{json} from "express";
import { MongoClient, ObjectId } from "mongodb";
import { stripHtml } from "string-strip-html";
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

// eslint-disable-next-line no-undef
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try{
	await mongoClient.connect();
}catch(err){
	print(err.message);
}

const db = mongoClient.db();
const nameSchema = joi.object({
	name: joi.string().min(3).max(30).required()
});


app.post("/participants", async(req, res) =>{
	
	const name = stripHtml(req.body.name).result.trim();
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
	const User = stripHtml(req.headers.user).result.trim();
	const {to, text, type} = req.body;
	const userValidation = nameSchema.validate({name: User});
	const validation = messageSchema.validate({
		to: stripHtml(to).result.trim(),
		text:stripHtml(text).result.trim(),
		type: stripHtml(type).result.trim()
	});

	if (userValidation.error) {
		const errors = userValidation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}

	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}

	try{
		const existUser = await db.collection("participants").findOne({name:User});
		
		if (!existUser) return res.status(404).send("Usuário não encontrado");
		await db.collection("messages").insertOne({
			from: User,
			to: stripHtml(to).result.trim(),
			text:stripHtml(text).result.trim(),
			type: stripHtml(type).result.trim(),
			time: dayjs().format("HH:mm:ss")
		});
		res.sendStatus(201);
	}catch(err){
		res.status(500).send(err.message);
	}
});

app.get("/messages", async(req, res)=>{
	const { limit } = req.query;
	const User = stripHtml(req.headers.user).result.trim();
	const limitSchema = joi.object({
		limit: joi.number().integer().min(1)
	});
	const userValidation = nameSchema.validate({name: User});

	if (userValidation.error) {
		const errors = userValidation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}
	

	try{
		const existUser = await db.collection("participants").findOne({name:User});
		
		if (!existUser) return res.status(404).send("Usuário não encontrado");

		const messages = await db.collection("messages").find({
			$or:[
				{to:"Todos"},
				{to:User},
				{from:User} 
			]}).toArray();

		if (limit) {
			const limitValidation = limitSchema.validate({limit: limit});
			if (limitValidation.error) {
				const errors = limitValidation.error.details.map((detail) => detail.message);
				return res.status(422).send(errors);
			}
			const page = [...messages].reverse().slice(0,limit);

			return res.send(page);
		}

		res.send(messages);
	}catch(err){
		res.status(500).send(err.message);
	}
});

app.post("/status", async(req, res)=>{
	const User = stripHtml(req.headers.user).result.trim();
	const userValidation = nameSchema.validate({name: User});

	if (userValidation.error) {
		const errors = userValidation.error.details.map((detail) => detail.message);
		return res.status(404).send(errors);
	}

	try{
		const existUser = await db.collection("participants").findOne({name:User});
		
		if (!existUser) return res.status(404).send("Usuário não encontrado");

		const updateStatus = await db.collection("participants").updateOne(
			{name: User},
			{$set: {lastStatus: Date.now()}}
		);
		
		if (updateStatus.matchedCount === 0) return res.sendStatus(404);

		res.sendStatus(200);

	}catch(err){
		res.status(500).send(err.message);
	}
});

app.delete("/messages/:ID_DA_MENSAGEM", async(req, res)=>{
	const User = stripHtml(req.headers.user).result.trim();
	const { ID_DA_MENSAGEM } = req.params;
	const paramSchema =  joi.object({
		id: joi.string().hex()
	});
	const validation = paramSchema.validate({id: ID_DA_MENSAGEM});
	const userValidation = nameSchema.validate({name: User});
	
	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(404).send(errors);
	}

	if (userValidation.error) {
		const errors = userValidation.error.details.map((detail) => detail.message);
		return res.status(404).send(errors);
	}

	try{
		const existUser = await db.collection("participants").findOne({name:User});
		
		if (!existUser) return res.status(404).send("Usuário não encontrado");
		const findMessage = await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)});

		if(!findMessage)return res.sendStatus(404);
		if(findMessage.from !== User ) return res.sendStatus(401);
		
		await db.collection("messages").deleteOne({_id: new ObjectId(ID_DA_MENSAGEM)});
		res.send("Item deletado com sucesso!");
	}catch(err){
		res.status(500).send(err.message);
	}
});

app.put("/messages/:ID_DA_MENSAGEM", async(req, res)=>{
	const messageSchema = joi.object({
		to: joi.string().min(3).max(30).required(),
		text: joi.string().required(),
		type: joi.string().required().valid("private").valid("private_message")
	});
	const User = stripHtml(req.headers.user).result.trim();
	const { ID_DA_MENSAGEM } = req.params;
	const {to, text, type} = req.body;
	const userValidation = nameSchema.validate({name: User});
	const validation = messageSchema.validate({
		to: stripHtml(to).result.trim(),
		text:stripHtml(text).result.trim(),
		type: stripHtml(type).result.trim()
	});

	if (userValidation.error) {
		const errors = userValidation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}

	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}

	try{
		const existUser = await db.collection("participants").findOne({name:User});
		
		if (!existUser) return res.status(404).send("Usuário não encontrado");

		const findMessage = await db.collection("messages").findOne({_id: new ObjectId(ID_DA_MENSAGEM)});

		if(!findMessage)return res.sendStatus(404);
		if(findMessage.from !== User ) return res.sendStatus(401);
		
		//await db.collection("messages").deleteOne({_id: new ObjectId(ID_DA_MENSAGEM)});
		
		await db.collection("messages").updateOne({_id: new ObjectId(ID_DA_MENSAGEM)},{
			$set: 
			{
				from: User,
				to: stripHtml(to).result.trim(),
				text:stripHtml(text).result.trim(),
				type: stripHtml(type).result.trim(),
				time: dayjs().format("HH:mm:ss")
			}
		});

		res.send("Mensagem atualizada com sucesso!");
		
	}catch(err){
		res.status(500).send(err.message);
	}
});

/* setInterval(async() => {
	try{
		const userOffline = await db.collection("participants").find(
			{
				lastStatus: {$lt: Date.now()-10000}
			}
		).toArray();

		if(userOffline){
	
			userOffline.map(async(u)=>{
	
				await db.collection("messages").insertOne({
					from: u.name, 
					to: "Todos", 
					text: "sai da sala...",
					type: "status",
					time: dayjs().format("HH:mm:ss")
				});

				const deleteUser = await db.collection("participants").deleteOne({name: u.name});

				if (deleteUser.deletedCount === 0) return print("Usuário não encontrado");

			});
		}
	}catch(err){
		print(err.message);
	}
	
}, 15000); */

app.listen(PORT, ()=>print(`Server online in port: ${PORT}`));