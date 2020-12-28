const {
	BotFrameworkAdapter,
	MemoryStorage,
	ConversationState,
} = require('botbuilder');
const restify = require('restify');
const { AttachmentsBot } = require('./src/bot/AttachmentsBot');

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log(`${server.name} listening on ${server.url}`);
});

const adapter = new BotFrameworkAdapter({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

const conversationState = new ConversationState(new MemoryStorage());

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

const bot = new AttachmentsBot();

server.post('/api/messages', (req, res) => {
	adapter.processActivity(req, res, async (context) => {
		await bot.run(context);
	});
});
