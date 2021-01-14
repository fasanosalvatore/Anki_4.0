import { prop, getModelForClass } from '@typegoose/typegoose';

export class Deck {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public userName!: string;

	@prop({ required: true })
	public deckName!: string;
}

export const DeckModel = getModelForClass(Deck);
