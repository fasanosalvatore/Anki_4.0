import { mongoose } from '@typegoose/typegoose';
import { DeckModel } from './model/Deck';
import { QuestionModel } from './model/Question';

//Connessione a CosmosDB
mongoose
	.connect(
		'mongodb://' +
			process.env.COSMOSDB_HOST +
			':' +
			process.env.COSMOSDB_PORT +
			'/' +
			process.env.COSMOSDB_DBNAME +
			'?ssl=true&replicaSet=globaldb',
		{
			auth: {
				user: process.env.COSMOSDB_USER!,
				password: process.env.COSMOSDB_PASSWORD!,
			},
			useNewUrlParser: true,
			useUnifiedTopology: true,
			// @ts-ignore
			retrywrites: false,
		},
	)
	.then(() => console.log('Connection to CosmosDB successful'))
	.catch((err) => console.error(err));

QuestionModel.create({
	userId: '284669056',
	question: 'Come ti chiami?',
	answer: 'Salvatore',
	deckName: 'Test 1 🤠',
});
QuestionModel.create({
	userId: '284669056',
	question: 'Come ti chiami?',
	answer: 'Gerardo',
	deckName: 'Test 1 🤠',
});
QuestionModel.create({
	userId: '284669056',
	question: 'Come ti chiami?',
	answer: 'Pasquale',
	deckName: 'Test 1 🤠',
});
QuestionModel.create({
	userId: '284669056',
	question: 'Come ti chiami?',
	answer: 'Raffaele',
	deckName: 'Test 1 🤠',
});
