import { MessageFactory, Activity, Attachment, CardFactory } from 'botbuilder';
import { s } from 'metronical.proto';

export function createCarousel(): Partial<Activity> {}

export function createHeroCard(): Attachment {
	return CardFactory.heroCard(
		'',
		CardFactory.images(['']),
		CardFactory.actions([{ type: 'OpenUrl', title: 'Read more..', value: '' }]),
	);
}
