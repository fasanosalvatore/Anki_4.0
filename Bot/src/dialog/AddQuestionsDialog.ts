import path from 'path';
import fs, { PathLike } from 'fs';
import axios from 'axios';
import * as Bluebird from 'bluebird';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import ffmpeg from 'fluent-ffmpeg';

import {
	ActionTypes,
	CardFactory,
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
	DialogTurnStatus,
	ListStyle,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { AttachmentTextPrompt } from './AttachmentTextPrompt';
import { Question, QuestionModel } from '../model/Question';

const ADD_QUESTION_DIALOG = 'ADD_QUESTION_DIALOG';
const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const ATT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'REPEAT_OR_NOT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class AddQuestionDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(ADD_QUESTION_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
			.addDialog(new AttachmentTextPrompt(ATT_PROMPT))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.firstStep.bind(this),
					this.secondStep.bind(this),
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
		return await step.prompt(ATT_PROMPT, {
			prompt:
				'Send us the text from which to extract the questions as a message or attachment',
		});
	}

	private async secondStep(step: WaterfallStepContext) {
		const { result: text } = step;
		//Effettuare qui la chiamata all'api per ottenere le domande/risposte e salvarle nel database
		try {
			// const questions = await axios.post(process.env.QNA_ML_ENDPOINT!, {text}) as [];
			// questions.map(async (qna: Question) => {
			//   const {question, answer} = qna
			//   return await QuestionModel.create({userId: step.context.activity.from.id, question, answer})
			// })
			await step.context.sendActivity(
				'The questions have been correctly generated, good luck!',
			);
		} catch (err) {
			await step.context.sendActivity(
				'Forgive me, there must have been some problem with the network, please try again soon.',
			);
		}
		return await step.prompt(CHOICE_PROMPT, {
			prompt: 'Would you like to enter other questions?',
			choices: ChoiceFactory.toChoices(['Yes', 'No, thanks']),
			style: ListStyle.suggestedAction,
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		const { index: scelta } = step.result;
		if (scelta === 1) {
			await step.context.sendActivity("Let's go back to the main menu.");
			return await step.endDialog();
		}
		return await step.replaceDialog(ADD_QUESTION_DIALOG);
	}
}
