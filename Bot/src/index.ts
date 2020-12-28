import { config } from 'dotenv';
config();
import {
	BotFrameworkAdapter,
	ConversationReference,
	ConversationState,
	MemoryStorage,
	UserState,
} from 'botbuilder';
const cron = require('node-cron');
import * as restify from 'restify';
import { Bot } from './bot/Bot';
import { MainDialog } from './dialog/MainDialog';
import { mongoose } from '@typegoose/typegoose';

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

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log(`${server.name} listening on ${server.url}`);
});

const adapter = new BotFrameworkAdapter({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Catch-all for errors
adapter.onTurnError = async (context, error) => {
	// This check writes out errors to console log .vs. app insights
	console.error(`\n [onTurnError] unhandled error: ${error}`);

	// Send a trace activity, which will be displayed in Bot Framework Emulator
	await context.sendTraceActivity(
		'OnTurnError Trace',
		`${error}`,
		'https://www.botframework.com/schemas/error',
		'TurnError',
	);

	// Send a message to the user
	await context.sendActivity('The bot encountered an error or bug.');
	await context.sendActivity(
		'To continue to run this bot, please fix the bot source code.',
	);

	// Clear out state
	await conversationState.delete(context);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const dialog = new MainDialog(userState);
const conversationReferences = {};
const bot = new Bot(
	conversationState,
	userState,
	dialog,
	conversationReferences,
);

server.post('/api/messages', (req, res) => {
	adapter.processActivity(req, res, async (context) => {
		await bot.run(context);
	});
});

cron.schedule('0 9 * * *', async function () {
	for (const conversationReference of Object.values(conversationReferences)) {
		await adapter.continueConversation(
			conversationReference as Partial<ConversationReference>,
			async (turnContext) => {
				const userProfileAccessor = userState.createProperty(
					'USER_PROFILE_PROPERTY',
				);
				const user = await userProfileAccessor.get(turnContext);
				await turnContext.sendActivity(`Hello ${user}, it's time to study!`);
			},
		);
	}
});
