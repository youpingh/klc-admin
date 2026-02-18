
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../service/store';

@Component({
  selector: 'admin-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrls: ['./loader.css']
})
export class LoaderComponent {

  running = false;
  logs: string[] = [];

  constructor(private loader: DataService) {}

  async uploadWords() {
    await this.runTask('Words', () => this.loader.uploadAllWords());
  }

  async uploadImages() {
    await this.runTask('Category Images', () => this.loader.uploadCategoryImages());
  }

  async uploadCategories() {
    await this.runTask('Categories', () => this.loader.uploadCategories());
  }

  private async runTask(name: string, task: () => Promise<number>) {
    if (this.running) return;

    this.running = true;
    this.log(`Start uploading: ${name}`);

    try {
      const rows = await task();
      this.log(`✅ Uploaded ${rows} ${name}.`);
    } catch (err: any) {
      this.log(`❌ Failed loading ${name}: ${err.message}`);
      console.error(err);
    } finally {
      this.running = false;
    }
  }

  // async runAll() {
  //   if (this.running) return;

  //   this.running = true;
  //   this.log('Starting full data upload...');

  //   try {
  //     await this.loader.uploadAll();
  //     this.log('✅ All data uploaded successfully');
  //   } catch (err: any) {
  //     this.log('❌ Error: ' + err.message);
  //     console.error(err);
  //   } finally {
  //     this.running = false;
  //   }
  // }

  private log(msg: string) {
    this.logs.unshift(`${new Date().toLocaleTimeString()}  ${msg}`);
  }
}
