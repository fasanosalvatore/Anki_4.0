import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import {
	ChoiceFactory,
	ChoicePrompt,
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	ListStyle,
	TextPrompt,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { DeckModel } from '../model/Deck';
import { Question, QuestionModel } from '../model/Question';

const MARKET_DECK_DIALOG = 'MARKET_DECK_DIALOG';
const NEW_DECK_DIALOG = 'NEW_DECK_DIALOG';
const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const CHOICE_PROMPT2 = 'CHOICE_PROMPT2';

export class MarketDeckDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(MARKET_DECK_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT2)).addDialog(
			new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
				this.firstStep.bind(this),
				this.finalStep.bind(this),
			]),
		);

		this.initialDialogId = MAIN_WATERFALL_DIALOG;
	}

	public async run(
		context: TurnContext,
		accessor: StatePropertyAccessor<DialogState>,
	) {
		const dialogSet = new DialogSet(accessor);
		dialogSet.add(this);

		const dialogContext = await dialogSet.createContext(context);
		const results = await dialogContext.continueDialog();
		if (results.status === DialogTurnStatus.empty) {
			await dialogContext.beginDialog(this.id);
		}
	}

	private async firstStep(step: WaterfallStepContext) {
		const decks = await DeckModel.find({
			userId: { $ne: step.context.activity.from.id },
		});
		if (decks.length == 0) {
			await step.context.sendActivity('There are no decks to import');

			return await step.endDialog();
		}
		return await step.prompt(CHOICE_PROMPT2, {
			prompt: 'Select the deck you want to import',
			choices: ChoiceFactory.toChoices([
				...decks.map((deck) => `${deck.deckName} by ${deck.userName}`),
			]),
			style: ListStyle.suggestedAction,
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		let { value: deckName } = step.result;
		deckName = deckName.split(' ')[0];
		const deck = await DeckModel.findOne({ deckName });
		if (deck) {
			await step.context.sendActivity(
				'Attention, it seems to us you have already imported this deck!',
			);
			return await step.endDialog();
		}
		const questions: Question[] = await QuestionModel.find({ deckName });
		await DeckModel.create({
			userId: step.context.activity.from.id,
			userName: step.context.activity.from.name,
			deckName,
		});
		questions.map(async (qna) => {
			const { question, answer } = qna;
			await QuestionModel.create({
				userId: step.context.activity.from.id,
				question,
				answer,
				deckName,
			});
		});

		await step.context.sendActivity(
			'The deck was successfully imported, it will now be selectable from the main menu!',
		);

		return await step.endDialog();
	}
}
