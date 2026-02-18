import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../service/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],

  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent { // implements OnInit {

  // the valid user indicator for UI to show page content accordingly
  isAdmin$: any;

  constructor(private auth: AuthService) {
    this.isAdmin$ = this.auth.isAdmin$;
  }
}