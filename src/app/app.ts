import { Component, signal } from '@angular/core';
import { D3Chart } from './d3-chart/d3-chart';

@Component({
  selector: 'app-root',
  imports: [D3Chart],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('scintillate-app');
}
