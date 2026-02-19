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
  private resizeListener: (() => void) | null = null;
  private colors = ['#CDC1D2', '#63A8AF', '#C19AAC', '#92B2BD', '#D8F6FE', '#BCB2B0'];
  private animationActive = true;
  animationSpeed = 2; // Default speed multiplier (1 = normal, 2 = faster, 0.5 = slower)

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
      .attr('y1', '100%')
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
      const rect = svg.append('path')
        .attr('opacity', 0.3)
        .attr('fill', `url(#gradient${i})`)
        .attr('filter', 'url(#edgeBlur)');
      
      // Set initial path with wavy right edge
      const initialWidth = i * rectWidth;
      rect.attr('d', this.createLeftWavyPath(initialWidth, height, 0));
      
      // Animate the width to create vacillating effect (skip i=0 which has no width)
      if (i > 0) {
        this.animateLeftRectangle(rect, i, rectWidth, height);
      }
    }

    // Create 3 rectangles on the right side
    for (let i = 0; i < 3; i++) {
      // Calculate position and width multiplier (i=0 -> mult=3, i=1 -> mult=2, i=2 -> mult=1)
      const multiplier = 3 - i;
      const xPosition = width - multiplier * rectWidth;
      const rect = svg.append('path')
        .attr('opacity', 0.3)
        .attr('fill', `url(#gradient${i + 3})`)
        .attr('filter', 'url(#edgeBlur)');
      
      // Set initial path with wavy left edge
      rect.attr('d', this.createRightWavyPath(xPosition, width, height, 0));
      
      // Animate the x position and width to create vacillating effect
      this.animateRightRectangle(rect, width, multiplier, rectWidth, height);
    }
  }

  private createLeftWavyPath(width: number, height: number, wavePhase: number): string {
    // Create a path with a straight left edge and wavy right edge
    const waveAmplitude = 15; // Amplitude of the wave
    const waveFrequency = 4; // Number of waves along the height
    const segments = 50; // Number of segments to create smooth wave
    
    let path = `M 0,0`; // Start at top-left
    path += ` L ${width},0`; // Top edge (straight)
    
    // Right edge (wavy)
    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * height;
      const wave = Math.sin((i / segments) * waveFrequency * Math.PI * 0.8 + wavePhase) * waveAmplitude;
      const x = width + wave;
      path += ` L ${x},${y}`;
    }
    
    path += ` L 0,${height}`; // Bottom-left corner
    path += ` Z`; // Close path
    
    return path;
  }

  private createRightWavyPath(xPosition: number, totalWidth: number, height: number, wavePhase: number): string {
    // Create a path with a wavy left edge and straight right edge
    const waveAmplitude = 15; // Amplitude of the wave
    const waveFrequency = 4; // Number of waves along the height
    const segments = 50; // Number of segments to create smooth wave
    
    let path = '';
    
    // Left edge (wavy)
    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * height;
      const wave = Math.sin((i / segments) * waveFrequency * Math.PI * 0.8 + wavePhase) * waveAmplitude;
      const x = xPosition + wave;
      if (i === 0) {
        path += `M ${x},${y}`; // Start point
      } else {
        path += ` L ${x},${y}`;
      }
    }
    
    path += ` L ${totalWidth},${height}`; // Bottom-right corner
    path += ` L ${totalWidth},0`; // Top-right corner
    path += ` Z`; // Close path
    
    return path;
  }

  private animateLeftRectangle(rect: any, index: number, rectWidth: number, height: number) {
    const baseWidth = index * rectWidth;
    const oscillationAmount = rectWidth * 0.15; // 15% oscillation
    const baseDuration = 1500 + (index * 250); // Faster base speed, slightly different for each layer
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    let wavePhase = 0;
    
    const animate = () => {
      if (!this.animationActive) return;
      
      // Store the starting phase for this cycle
      const startPhase = wavePhase;
      
      rect.transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attrTween('d', () => {
          return (t: number) => {
            const currentWidth = baseWidth + oscillationAmount * d3.easeSinInOut(t);
            const currentPhase = startPhase + t * 0.5;
            return this.createLeftWavyPath(currentWidth, height, currentPhase);
          };
        })
        .transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attrTween('d', () => {
          return (t: number) => {
            const currentWidth = baseWidth + oscillationAmount - (2 * oscillationAmount * d3.easeSinInOut(t));
            const currentPhase = startPhase + 0.5 + t * 0.5;
            return this.createLeftWavyPath(currentWidth, height, currentPhase);
          };
        })
        .on('end', () => {
          // Update phase to continue smoothly from where we ended (keep within reasonable range)
          wavePhase = (startPhase + 1.0) % (Math.PI * 0.8);
          animate();
        });
    };
    
    animate();
  }

  private animateRightRectangle(rect: any, width: number, multiplier: number, rectWidth: number, height: number) {
    const baseX = width - multiplier * rectWidth;
    const oscillationAmount = rectWidth * 0.15; // 15% oscillation
    const baseDuration = 1500 + (multiplier * 250); // Faster base speed, slightly different for each layer
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    let wavePhase = 0;
    
    const animate = () => {
      if (!this.animationActive) return;
      
      // Store the starting phase for this cycle
      const startPhase = wavePhase;
      
      rect.transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attrTween('d', () => {
          return (t: number) => {
            const currentX = baseX - oscillationAmount * d3.easeSinInOut(t);
            const currentPhase = startPhase + t * 0.5;
            return this.createRightWavyPath(currentX, width, height, currentPhase);
          };
        })
        .transition()
        .duration(duration)
        .ease(d3.easeSinInOut)
        .attrTween('d', () => {
          return (t: number) => {
            const currentX = baseX - oscillationAmount + (2 * oscillationAmount * d3.easeSinInOut(t));
            const currentPhase = startPhase + 0.5 + t * 0.5;
            return this.createRightWavyPath(currentX, width, height, currentPhase);
          };
        })
        .on('end', () => {
          // Update phase to continue smoothly from where we ended (keep within reasonable range)
          wavePhase = (startPhase + 1.0) % (Math.PI * 0.8);
          animate();
        });
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
}
