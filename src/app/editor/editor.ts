import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { Category, Word } from '../model/AppModules';
import { SpeakerService } from '../service/speaker';
import { DataService } from '../service/store';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css']
})
export class EditorComponent implements OnInit {

  private speaker = inject(SpeakerService);
  private store = inject(DataService);

  private readonly DEFAULT_CATEGORY = 'Unknown';
  private readonly DELETED_CATEGORY = 'Deleted';

  categories$: Observable<Category[]>;
  words: Word[] = [];
  pageMessage: string = '';

  // filters
  filterCategory = '';
  filterLevel: number | null = null;

  // pagination
  pageSize = 15;
  currentPage = 0;

  // a default new word and a search word
  newWord = {
    chinese: '',
    category: this.DEFAULT_CATEGORY,
    level: 7,
    index: 1,
    pinyin: '',
    english: '',
    phrase: [],
    sentence: 'To Be Added',
    image: '',
    selected: false,
    dirty: true,
    isNew: true
  } as Word;

  wordString: string = '';

  constructor() {
    this.filterLevel = 1;
    this.categories$ = this.store.getCategories();
  }

  ngOnInit(): void {
    this.loadWords();
    this.addEventHandler();
  }

  private addEventHandler() {
    document.addEventListener('click', () => {
      this.pageMessage = '';
    });
  }

  getFilterCategory() {
    return (this.filterCategory.length == 0 ? 'all categories' : 'the category of ' + this.filterCategory);
  }

  /**
   * Loads words from the database by category and level.
   */
  async loadWords() {
    const data$ = this.store.loadWords(this.filterCategory, this.filterLevel);
    data$.subscribe(words => {
      this.words = words;
      this.words.forEach(w => { w.selected = false; w.dirty = false; w.isNew = false });
      this.currentPage = 0;
    });
  }

  /**
   * Searches a character from the database by Chinese or English.
   */
  async searchWord() {
    if (this.wordString.length == 0) {
      return;
    }

    let word: Word | null = null;
    const data$ = this.store.searchWord(this.wordString);
    data$.subscribe(words => {
      if (words.length > 0) {
        word = words[0];
        // this.words.unshift(word);
        this.words = [];
        this.words.push(word);
        this.currentPage = 0;
        console.log(`Got a word from the collection ${word.chinese}`);
      } else {
        this.pageMessage = `No this word: ${this.wordString}`;
      }
    });
  }

  /**
   * Creates a word array for this page.
   */
  get pagedWords(): Word[] {
    const start = this.currentPage * this.pageSize;
    return this.words.slice(start, start + this.pageSize);
  }

  /**
   * Sets the next page.
   */
  nextPage() {
    if ((this.currentPage + 1) * this.pageSize < this.words.length) {
      this.currentPage++;
    }
  }

  /**
   * Sets the previous page
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  /**
   * Marks the word as a dirty row (unsaved)
   * @param word 
   */
  markDirty(word: Word) {
    word.dirty = true;
  }

  /**
   * Marks the word as a dirty row and gets Pinyin for this word as the word.chinese field is changed.
   * @param word 
   */
  keyChanged(word: Word) {
    this.markDirty(word);
    this.fillPinyin(word);
  }

  /**
   * Saves or updates the changed word to the database.
   * @param word 
   * @returns 
   */
  async saveWord(word: Word) {
    if (!word.chinese || !word.dirty) return;
    await this.store.saveWord(word);
    word.dirty = false;
    this.pageMessage = `save a word: ${word.chinese}`;
    console.log(this.pageMessage);
  }

  /**
   * Adds a new row to the word array. The new word is not saved to the database.
   */
  async addWord() {
    this.words.unshift(this.newWord);
  }

  /**
   * Saves or updates all changed words
   */
  async saveChangedWords() {
    const dirtyWords = this.words.filter(word => word.dirty);
    this.store.saveChangedWords(dirtyWords);
    this.pageMessage = 'saved all changed words';
    console.log(this.pageMessage);
  }

  /**
   * Checks if there are some changed (dirty, unsaved) words.
   * @returns 
   */
  hasDirtyWords() {
    const dirtyWords = this.words.filter(word => word.dirty);
    return (dirtyWords && dirtyWords.length > 0);
  }

  /**
   * Deletes a selected word by marking its category to 'Deleted'.
   */
  async deleteSelected() {
    const toDelete = this.words.filter(w => w.selected && w.chinese);
    for (const word of toDelete) {
      word.category = this.DELETED_CATEGORY;
      this.saveWord(word);
    }
    this.pageMessage = `${toDelete.length} characters are deleted (marked as Deleted)}`;
    console.log(this.pageMessage);
    // this.loadWords();
  }

  /**
   * Gets Pinyin of the word.chinese field.
   * @param word 
   */
  async fillPinyin(word: Word) {
    if (word.chinese) {
      word.pinyin = await this.speaker.getPinyin(word.chinese);
      console.log(`get pinyin for ${word.chinese}`);
    }
  }

  toggleAll(checked: boolean) {
    this.pagedWords.forEach(w => (w.selected = checked));
  }
}
