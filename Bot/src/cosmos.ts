import { getModelForClass, mongoose, prop } from '@typegoose/typegoose';
import { config } from 'dotenv';
config();

async function init() {
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

	// const question = await QuestionModel.create({
	// 	userId: '1',
	// 	question: 'Come stai?',
	// 	answer: 'Bene',
	// 	nextCheckDate: new Date('2021-01-10'),
	// });

	const questions = await QuestionModel.find({
		nextCheckDate: { $lte: new Date() },
	});
	console.log(questions);

	process.exit();
}

init();
