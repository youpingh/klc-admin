import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { AuthService } from './service/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class AppComponent implements OnInit {

  auth: AuthService = inject(AuthService);

  // the valid admin user indicator for UI to show page content accordingly
  isAdmin$: any;

  constructor() {
    this.isAdmin$ = this.auth.isAdmin$;
  }

  async ngOnInit() {
    await this.auth.signInSilently();
  }

  loginGoogle() {
    this.auth.signInWithGoogle().catch(console.error);
  }

  signOut() {
    this.auth.signOut();
  }

  getUserEmail() {
    return this.auth.getUserEmail();
  }
}