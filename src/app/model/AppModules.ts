
/** The word category */
export interface Category {
    category: string;
    cname: string;
    sequence: number;
    words: Word[];
}

/** The word */
export interface Word {
    level: number;
    index: number;
    category: string;
    chinese: string;
    english: string;
    pinyin: string;
    phrase: string[];
    sentence: string;
    image: string;
    
    selected: boolean;
    dirty: boolean;
    isNew: boolean;
}

/** The greeting image */
export interface GreetingImage {
    category: string;
    wrong: string;
    ok: string;
    icon: string;
    great: string[];
}

/** The app user */
export interface AppUser {
    email: string;
    allowed: boolean;
    level: number;
    role: string;
    name: string;
}

/** The pinyin retrieved from Google's translation service */
export interface Pinyin {
    status: boolean;
    text: string;
    pinyin: string;
    error: string;
}
