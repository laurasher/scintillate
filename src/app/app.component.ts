import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'scintillate';
  private resizeListener: (() => void) | null = null;
  private colors = ['#CDC1D2', '#63A8AF', '#C19AAC', '#92B2BD', '#D8F6FE', '#BCB2B0'];
  private animationActive = true;
  animationSpeed = 2; // Default speed multiplier (1 = normal, 2 = faster, 0.5 = slower)
  rectangleState: 'hidden' | 'emerging' | 'centered' | 'dissolving' = 'hidden';
  private centerRect: any = null;

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
    this.animationActive = false;
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private createVisualization() {
    // Remove any existing SVG
    d3.select('#d3-container').selectAll('svg').remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const rectWidth = width * 0.1;

    // Create SVG container
    const svg = d3.select('#d3-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create defs for gradients
    const defs = svg.append('defs');

    // Create blur filter for smooth edges
    const filter = defs.append('filter')
      .attr('id', 'edgeBlur')
      .attr('x', '-250%')
      .attr('y', '0%')
      .attr('width', '550%')
      .attr('height', '100%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '20,0');

    // Create background gradient (315deg angle)
    const bgGradient = defs.append('linearGradient')
      .attr('id', 'backgroundGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    bgGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#CDC1D2');

    bgGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#B7C5E8');

    // Function to create a gradient with random colors
    const createGradient = (id: string) => {
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      const color1 = this.getRandomColor();
      const color2 = this.getRandomColor();

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

    // Add background rectangle first (so it's behind everything else)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      // .attr('opacity', 0.5)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#backgroundGradient)');

    // Create 3 rectangles on the left side (widest to narrowest)
    for (let i = 3; i >= 0; i--) {
      const rect = svg.append('rect')
        .attr('x',  0)
        .attr('y', 0)
        .attr('opacity', 0.3)
        .attr('width', (i) * rectWidth)
        .attr('height', height)
        .attr('fill', `url(#gradient${i})`)
        .attr('filter', 'url(#edgeBlur)');
      
      // Animate the width to create vacillating effect (skip i=0 which has no width)
      if (i > 0) {
        this.animateLeftRectangle(rect, i, rectWidth);
      }
    }

    // Create 3 rectangles on the right side
    for (let i = 0; i < 3; i++) {
      // Calculate position and width multiplier (i=0 -> mult=3, i=1 -> mult=2, i=2 -> mult=1)
      const multiplier = 3 - i;
      const xPosition = width - multiplier * rectWidth;
      const rect = svg.append('rect')
        .attr('x', xPosition)
        .attr('y', 0)
        .attr('opacity', 0.3)
        .attr('width', width - xPosition)
        .attr('height', height)
        .attr('fill', `url(#gradient${i + 3})`)
        .attr('filter', 'url(#edgeBlur)');
      
      // Animate the x position and width to create vacillating effect
      this.animateRightRectangle(rect, width, multiplier, rectWidth);
    }
  }

  private animateLeftRectangle(rect: any, index: number, rectWidth: number) {
    const baseWidth = index * rectWidth;
    const oscillationAmount = rectWidth * 0.15; // 15% oscillation
    const baseDuration = 1500 + (index * 250); // Faster base speed, slightly different for each layer
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    
    const animate = () => {
      if (!this.animationActive) return;
      
      rect.transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attr('width', baseWidth + oscillationAmount)
        .transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attr('width', baseWidth - oscillationAmount)
        .on('end', animate);
    };
    
    animate();
  }

  private animateRightRectangle(rect: any, width: number, multiplier: number, rectWidth: number) {
    const baseX = width - multiplier * rectWidth;
    const oscillationAmount = rectWidth * 0.15; // 15% oscillation
    const baseDuration = 1500 + (multiplier * 250); // Faster base speed, slightly different for each layer
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    
    const animate = () => {
      if (!this.animationActive) return;
      
      rect.transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attr('x', baseX - oscillationAmount)
        .attr('width', width - (baseX - oscillationAmount))
        .transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attr('x', baseX + oscillationAmount)
        .attr('width', width - (baseX + oscillationAmount))
        .on('end', animate);
    };
    
    animate();
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private onResize() {
    this.createVisualization();
  }

  onSpeedChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const newSpeed = parseFloat(input.value);
    // Prevent division by zero or negative values
    if (newSpeed > 0) {
      this.animationSpeed = newSpeed;
      // Recreate visualization with new speed
      this.createVisualization();
    }
  }

  onTriggerRectangle() {
    if (this.rectangleState === 'hidden') {
      this.rectangleState = 'emerging';
      this.emergeRectangle();
    }
  }

  private emergeRectangle() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const rectWidth = width * 0.3;
    const rectHeight = height * 0.4;
    const centerX = (width - rectWidth) / 2;
    const centerY = (height - rectHeight) / 2;

    const svg = d3.select('#d3-container svg');

    // Create the white rectangle with rounded corners
    this.centerRect = svg.append('rect')
      .attr('class', 'center-rectangle')
      .attr('x', 0)
      .attr('y', centerY)
      .attr('width', 0)
      .attr('rx', 20)
      .attr('ry', 20)
      .attr('height', rectHeight)
      .attr('fill', 'white')
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('click', () => this.onCenterRectangleClick());

    // Animate emergence from left side to center
    this.centerRect
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr('x', centerX)
      .attr('width', rectWidth)
      .attr('opacity', 0.9)
      .on('end', () => {
        this.rectangleState = 'centered';
      });
  }

  private onCenterRectangleClick() {
    if (this.rectangleState === 'centered') {
      this.rectangleState = 'dissolving';
      this.dissolveRectangle();
    }
  }

  private dissolveRectangle() {
    if (!this.centerRect) return;

    const width = window.innerWidth;
    const currentX = parseFloat(this.centerRect.attr('x'));
    const currentWidth = parseFloat(this.centerRect.attr('width'));

    // Animate dissolution to right side
    this.centerRect
      .transition()
      .duration(1500)
      .ease(d3.easeCubicIn)
      .attr('x', width)
      .attr('width', 0)
      .attr('opacity', 0)
      .on('end', () => {
        this.centerRect.remove();
        this.centerRect = null;
        this.rectangleState = 'hidden';
      });
  }
}
