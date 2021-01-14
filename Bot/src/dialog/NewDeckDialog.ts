import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import {
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	TextPrompt,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { DeckModel } from '../model/Deck';

const NEW_DECK_DIALOG = 'NEW_DECK_DIALOG';
const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class NewDeckDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(NEW_DECK_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new TextPrompt(TEXT_PROMPT)).addDialog(
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
		return await step.prompt(TEXT_PROMPT, {
			prompt: 'What is the name of the new deck?',
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		let { result: deckName } = step;
		const deck = await DeckModel.findOne({ deckName });
		if (deck) {
			await step.context.sendActivity(
				'Attention, the deck name must be unique, try again with a new name!',
			);
			return await step.replaceDialog(NEW_DECK_DIALOG);
		}
		await DeckModel.create({
			userId: step.context.activity.from.id,
			userName: step.context.activity.from.name,
			deckName,
		});
		await step.context.sendActivity(
			'The new deck has been created, it will now be selectable from the main menu!',
		);

		return await step.endDialog();
	}
}
