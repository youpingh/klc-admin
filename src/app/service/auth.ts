import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Auth, signInWithPopup, GoogleAuthProvider, User } from '@angular/fire/auth';
import { setPersistence, browserLocalPersistence, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {

	private auth = inject(Auth);

	private userSubject = new BehaviorSubject<User | null>(null);
	readonly user$ = this.userSubject.asObservable();

	private adminSubject = new BehaviorSubject<boolean>(false);
	readonly isAdmin$ = this.adminSubject.asObservable();

	private userEmail: string | null = null;

	constructor() {
		onAuthStateChanged(this.auth, async user => {
			this.userSubject.next(user);

			if (user) {
				this.userEmail = user.email;
				console.log(`Signed in: ${user.email}`);

				const tokenResult = await user.getIdTokenResult();
				const isAdmin = tokenResult.claims['admin'] === true;

				this.adminSubject.next(isAdmin);
				console.log('Admin:', isAdmin);
			} else {
				this.userEmail = null;
				this.adminSubject.next(false);
				console.log('Signed out');
			}
		});
	}

	async signInSilently() {
		await setPersistence(this.auth, browserLocalPersistence);
	}

	signInWithGoogle() {
		return signInWithPopup(this.auth, new GoogleAuthProvider());
	}

	signOut() {
		return this.auth.signOut();
	}

	getUserEmail() {
		return this.userEmail;
	}
}
