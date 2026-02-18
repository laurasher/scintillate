import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'scintillate';
  private resizeListener: any;
  private colors = ['#CDC1D2', '#63A8AF', '#C19AAC', '#92B2BD', '#D8F6FE', '#BCB2B0'];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Only run d3 visualization in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.createVisualization();
      this.resizeListener = () => this.onResize();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private createVisualization() {
    // Remove any existing SVG
    d3.select('#d3-container').selectAll('svg').remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const rectWidth = width * 0.15;

    // Create SVG container
    const svg = d3.select('#d3-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create defs for gradients
    const defs = svg.append('defs');

    // Function to create a gradient with random colors
    const createGradient = (id: string) => {
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      const color1 = this.colors[Math.floor(Math.random() * this.colors.length)];
      const color2 = this.colors[Math.floor(Math.random() * this.colors.length)];

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color1);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color2);
    };

    // Create gradients for all rectangles
    for (let i = 0; i < 6; i++) {
      createGradient(`gradient${i}`);
    }

    // Create 3 rectangles on the left side
    for (let i = 0; i < 3; i++) {
      svg.append('rect')
        .attr('x', i * rectWidth)
        .attr('y', 0)
        .attr('width', rectWidth)
        .attr('height', height)
        .attr('fill', `url(#gradient${i})`);
    }

    // Create 3 rectangles on the right side
    for (let i = 0; i < 3; i++) {
      svg.append('rect')
        .attr('x', width - (3 - i) * rectWidth)
        .attr('y', 0)
        .attr('width', rectWidth)
        .attr('height', height)
        .attr('fill', `url(#gradient${i + 3})`);
    }
  }

  private onResize() {
    this.createVisualization();
  }
}
