
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Pinyin } from '../model/AppModules';

@Injectable({
	providedIn: 'root'
})
/**
 * This is a speaker utility to use text-to-speech and speech-to-text for speaking and check pronounazation.
 */
export class SpeakerService {

	/** 
	 * Gets pinyin of the text using Google's translator. 
	 */
	async getPinyin(text: string) {

		const request = {
			text: text
		}

		try {
			const response = await fetch(environment.services.pinyin, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});
			const pinyin = await response.json() as Pinyin;
			return pinyin.pinyin;
		} catch (error) {
			console.error(`Error getting Pinyin for ${text} - ${error}`);
			return '';
		}
	}
}
