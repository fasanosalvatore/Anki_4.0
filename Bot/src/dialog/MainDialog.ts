import {
	ActionTypes,
	CardFactory,
	InputHints,
	MessageFactory,
	StatePropertyAccessor,
	TurnContext,
	UserState,
} from 'botbuilder';
import {
	ChoiceFactory,
	ChoicePrompt,
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnResult,
	DialogTurnStatus,
	ListStyle,
	TextPrompt,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { QuestionModel } from '../model/Question';
import { StudyDialog } from './StudyDialog';

const MAIN_DIALOG = 'MAIN_DIALOG';
const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const STUDY_DIALOG = 'STUDY_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class MainDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	constructor(userState: UserState) {
		super(MAIN_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
			.addDialog(new TextPrompt(TEXT_PROMPT))
			.addDialog(new StudyDialog(userState))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.welcomeStep.bind(this),
					this.initialStep.bind(this),
					this.addQuestionStep.bind(this),
					this.studyStep.bind(this),
					this.finalStep.bind(this),
					// this.finalStep.bind(this),
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

	private async welcomeStep(step: WaterfallStepContext) {
		const user = await this.userProfileAccessor.get(step.context);
		if (user) return await step.next();
		const messageText =
			"It seems to me this is the first time we meet, what's your name?";

		const promptMessage = MessageFactory.text(
			messageText,
			messageText,
			InputHints.ExpectingInput,
		);

		return await step.prompt(TEXT_PROMPT, {
			prompt: promptMessage,
		});
	}

	private async initialStep(step: WaterfallStepContext) {
		const user = await this.userProfileAccessor.get(step.context);
		if (!user) {
			await this.userProfileAccessor.set(step.context, step.result);
		}
		const userName = user || step.result;

		const messageText = `Hi ${userName}! What do you want to do?`;

		const promptMessage = MessageFactory.text(
			messageText,
			messageText,
			InputHints.ExpectingInput,
		);

		return await step.prompt(CHOICE_PROMPT, {
			prompt: promptMessage,
			choices: ChoiceFactory.toChoices([
				'I want to add new questions',
				"I think it's time to study",
			]),
			style: ListStyle.suggestedAction,
		});
	}

	private async addQuestionStep(step: WaterfallStepContext) {
		const { index: scelta } = step.result;
		if (scelta !== 0) {
			return await step.next(step.result);
		}

		const buttons = [
			{
				type: ActionTypes.ImBack,
				title: 'Text',
				value: 'text',
			},
			{
				type: ActionTypes.ImBack,
				title: 'File',
				value: 'file',
			},
		];

		const card = CardFactory.heroCard(
			'How do you intend to send me the new paragraphs?',
			undefined,
			buttons,
		);

		const reply = { attachments: [card] };

		return await step.context.sendActivity(reply);
	}

	private async studyStep(step: WaterfallStepContext) {
		const { index: scelta } = step.result;
		if (!scelta || scelta !== 1) return await step.next(step.result);
		return await step.beginDialog(STUDY_DIALOG);
	}

	private async finalStep(step: WaterfallStepContext) {
		const { result } = step;
		const user = await this.userProfileAccessor.get(step.context);
		if (result) {
			await step.context.sendActivity(
				`Looks like you're done for today, congratulations ${user}! See you tomorrow to study!`,
			);
		} else
			await step.context.sendActivity(
				`Are you tired? I'm sure you will recover tomorrow!`,
			);
		return await step.replaceDialog(MAIN_DIALOG);
	}
}
