
import { Injectable, inject } from '@angular/core';
import {
	Firestore,
	doc,
	setDoc,
	getDocs,
	getDoc,
	writeBatch,
	collection,
	collectionData,
	query,
	where,
	or,
	orderBy,
	updateDoc
} from '@angular/fire/firestore';

import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Category, Word } from '../model/AppModules';

@Injectable({ providedIn: 'root' })
export class DataService {

	// assets location
	private readonly USERS_FILE = 'assets/data/users.json';
	private readonly CATEGORIES_FILE = 'assets/data/categories.json';
	private readonly IMAGES_FILE = 'assets/data/greeting-images.json';
	private readonly WORDS_FILE = 'assets/data/words.json';
	private readonly CURRENT_WORDS_FILE = 'assets/data/current-characters.json';
	private readonly HSK_WORDS_FILE = 'assets/data/hsk-characters.json';

	private firestore: Firestore = inject(Firestore);

	//
	// Service methods for the words editor
	//
	getCategories() {
		const categoriesRef = collection(this.firestore, 'categories');
		return collectionData(categoriesRef) as Observable<Category[]>;
	}

	loadWords(category: string, level: number | null): Observable<Word[]> {
		const wordsRef = collection(this.firestore, environment.words);
		let q = query(wordsRef);

		if (category) {
			q = query(q, where('category', '==', category));
		}
		if (level !== null) {
			q = query(q, where('level', '==', level));
		}
		q = query(q, orderBy('index'));
		const words = collectionData(q, { idField: 'chinese' }) as Observable<Word[]>;
		return words;
	}

	searchWord(searchWord: string): Observable<Word[]> {
		const wordsRef = collection(this.firestore, environment.words);
		const q = query(wordsRef,
			or(
				where('chinese', '==', searchWord),
				where('english', '==', searchWord.toLowerCase())
			));
		const words = collectionData(q, { idField: 'chinese' }) as Observable<Word[]>;
		return words;
	}

	async saveWord(word: Word) {
		if (!word.chinese || !word.dirty) return;

		const ref = doc(this.firestore, environment.words, word.chinese);

		// take out the UI only fields out of the payload
		const { selected, dirty, isNew, ...payload } = word;

		await updateDoc(ref, payload);
	}

	async saveChangedWords(words: Word[]): Promise<number> {
		console.log('Start saving words ...');
		let batch = writeBatch(this.firestore);
		let count = 0;

		for (let word of words) {
			if (word.dirty && word.chinese) {
				// take the UI only fields out of the payload
				const { selected, dirty, isNew, ...payload } = word;
				const ref = doc(this.firestore, environment.words, word.chinese);
				batch.set(ref, payload);
				count++;
			}
		}

		if (count > 0) {
			await batch.commit();
		}

		console.log('Words saved:', count);
		return count;
	}

	//
	// Service methods for the data loader
	//
	async uploadAll(): Promise<void> {
		await this.uploadAllWords();
		await this.uploadGreetingImages();
		await this.uploadCategories();
		await this.uploadUsers();
	}

	async uploadCategories(): Promise<number> {
		console.log('Start uploading categories ...');
		const categories = await this.loadJSON(this.CATEGORIES_FILE);

		for (const category of categories) {
			const ref = doc(this.firestore, environment.categories, category.category);
			await setDoc(ref, category);
		}

		console.log('Categories imported:', categories.length);
		return categories.length;
	}

	async uploadUsers(): Promise<number> {
		console.log('Start uploading users ...');
		const users = await this.loadJSON(this.USERS_FILE);

		for (const user of users) {
			const ref = doc(this.firestore, environment.users, user.email);
			await setDoc(ref, user);
		}

		console.log('Categories imported:', users.length);
		return users.length;
	}

	async uploadGreetingImages(): Promise<number> {
		console.log('Start uploading images ...');
		const images = await this.loadJSON(this.IMAGES_FILE);

		for (const image of images) {
			const ref = doc(this.firestore, environment.greetingImages, image.category);
			await setDoc(ref, image);
		}

		console.log('Greeting images imported:', images.length);
		return images.length;
	}

	async uploadAllWords(): Promise<number> {
		console.log('Start uploading words ...');
		const words = await this.loadJSON(this.WORDS_FILE);
		await this.batchUploadWords(environment.words, words);
		console.log('Words imported:', words.length);
		return words.length;
	}

	async mergeWords(): Promise<number> {
		console.log('Start merging words ...');
		const words = await this.convertWords();
		await this.batchUploadWords(environment.words, words);
		console.log('Words imported:', words.length);
		return words.length;
	}

	/**
	 * Converts the HSK words into words and merges the current words.
	 * @returns 
	 */
	async convertWords() {
		const currentWords = await this.loadJSON(this.CURRENT_WORDS_FILE);
		const hskWords = await this.loadJSON(this.HSK_WORDS_FILE);

		let mergedWords = [];

		for (let entry of hskWords) {
			// 1. Get top-level fields
			const simplified = entry.simplified || '';
			const existingWord = currentWords.find(w => w.chinese == simplified);
			if (simplified.length == 1 && !existingWord) {
				// 2. Shorten the levels (new-1 -> n1, etc.)
				const level = this.shortenLevel(entry.level);
				const categoryName = this.getCategoryName(level, entry.pos);

				// 3. Extract Pinyin from nested structure: forms[0].transcriptions.pinyin
				let pinyin = "";
				let meaning = "";
				if (entry.forms && entry.forms.length > 0) {
					const transcriptions = entry.forms[0].transcriptions || {};
					pinyin = transcriptions.pinyin || "";
					const meanings = entry.forms[0].meanings || {};
					if (meanings.length > 0) {
						for (let m of meanings) {
							meaning += m + ', ';
						}
						const idx = meaning.lastIndexOf(', ');
						if (idx > 0) {
							meaning = meaning.substring(0, idx);
						}
					}
				}

				// 4. Return the new lean object
				let phrases: string[] = [];
				mergedWords.push({
					level: level,
					index: 1,
					category: categoryName,
					chinese: simplified,
					english: meaning.toLowerCase(),
					pinyin: pinyin,
					phrase: phrases,
					sentence: '',
					image: ''
				});
			}
		}

		// add phrases to each single character item
		for (let char of mergedWords) {
			const phraseList = hskWords.filter(entry => {
				const simplified = entry.simplified || '';
				return simplified.indexOf(char.chinese) >= 0 && simplified.length > 1;
			});
			let phrases = [];
			for (const item of phraseList) {
				phrases.push(item.simplified);
			}
			char.phrase = phrases;
		}

		// get the existing words and trim the 'tokens' field
		for (let entry of currentWords) {
			mergedWords.push({
				level: entry.level,
				index: entry.index,
				category: entry.category,
				chinese: entry.chinese,
				english: entry.english.toLowerCase(),
				pinyin: entry.pinyin,
				phrase: entry.phrase,
				sentence: entry.sentence,
				image: entry.image
			});
		}

		return mergedWords;
	}

	private async loadJSON(path: string): Promise<any[]> {
		const res = await fetch(path);
		if (!res.ok) {
			throw new Error(`Failed to load ${path}`);
		}
		return res.json();
	}

	private shortenLevel(levelArray: string) {
		if (!Array.isArray(levelArray)) {
			console.log("empty level array");
			return 10;
		}

		let newLevel = 0;
		let oldLevel = 0;
		for (let level of levelArray) {
			if (level.startsWith("new-")) {
				newLevel = parseInt(level.replace("new-", ""), 10);
			} else if (level.startsWith("old-")) {
				oldLevel = parseInt(level.replace("old-", ""), 10);
			} else {
				oldLevel = newLevel = 10;
			}
		}
		const singleLevel = Math.max(newLevel, oldLevel);
		return singleLevel;
	}

	/**
	 * Helper to convert category names:
	 * n: Noun, v*: Verb, a: Adjective, y|e: 语气词 Interjections
	 */
	private getCategoryName(level: number, pos: string[]) {
		if (!Array.isArray(pos) || pos.length == 0 || level < 4) {
			console.log("empty pos array or low level");
			return 'Unknown';
		}

		const type = pos[0];
		if (type.startsWith('n')) return 'Noun';
		if (type.startsWith('v')) return 'Verb';
		if (type.startsWith('a')) return 'Adjective';
		if (type.startsWith('y') || type.startsWith('e')) return 'Interjections，'
		return 'Unknown';
	}

	private async batchUploadWords(collection: string, data: any[]): Promise<void> {
		let batch = writeBatch(this.firestore);
		let count = 0;

		for (const item of data) {
			if (!item.chinese) continue;

			const ref = doc(this.firestore, collection, item.chinese);
			// use the first word of the English array
			// if (item.english && item.english.length > 0) {
			// 	const firstWord = item.english[0];
			// 	item.english = firstWord;
			// } else {
			// 	item.english = '';
			// }
			batch.set(ref, item);
			count++;

			if (count === 500) {
				await batch.commit();
				batch = writeBatch(this.firestore);
				count = 0;
			}
		}

		if (count > 0) {
			await batch.commit();
		}
	}
}
