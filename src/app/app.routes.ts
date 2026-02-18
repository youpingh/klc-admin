import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { LoaderComponent } from './loader/loader';
import { EditorComponent } from './editor/editor';

export const routes: Routes = [
  { path: 'loader', component: LoaderComponent },
  { path: 'editor', component: EditorComponent },
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];