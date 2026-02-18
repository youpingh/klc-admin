import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // Update this import if renamed

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));