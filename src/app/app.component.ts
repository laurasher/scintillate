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
  private colorCycleTimeouts: number[] = [];
  animationSpeed = 2; // Default speed multiplier (1 = normal, 2 = faster, 0.5 = slower)
  private glidingRectVisible = false; // Track if gliding rectangle is on screen
  private glidingRect: d3.Selection<SVGRectElement, unknown, HTMLElement, unknown> | null = null; // Reference to the gliding rectangle
  
  // Constants for gliding rectangle positioning
  private readonly GLIDING_RECT_SPACING = 30; // Spacing from rectangle group
  private readonly OFF_SCREEN_OFFSET = 50; // Offset for hiding off-screen

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
    
    // Clear any pending color cycle timeouts
    this.colorCycleTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.colorCycleTimeouts = [];
    
    // Cancel any active D3 transitions
    if (isPlatformBrowser(this.platformId)) {
      d3.selectAll('stop').interrupt();
    }
    
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private createVisualization() {
    // Remove any existing SVG
    d3.select('#d3-container').selectAll('svg').remove();
    
    // Clear existing timeouts and reset array
    this.colorCycleTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.colorCycleTimeouts = [];

    const width = window.innerWidth;
    const height = window.innerHeight;
    const rectWidth = width * 0.1;

    // Create SVG container
    const svg = d3.select('#d3-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('cursor', 'pointer')
      .on('click', () => this.onSvgClick());

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
    const createGradient = (id: string, index: number) => {
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      const [color1, color2] = this.getTwoDifferentColors();

      gradient.append('stop')
        .attr('class', `stop-0-${index}`)
        .attr('offset', '0%')
        .attr('stop-color', color1);

      gradient.append('stop')
        .attr('class', `stop-1-${index}`)
        .attr('offset', '100%')
        .attr('stop-color', color2);
      
      // Start color cycling animation for this gradient
      this.cycleGradientColors(index);
    };

    // Create gradients for all rectangles
    for (let i = 0; i < 6; i++) {
      createGradient(`gradient${i}`, i);
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

    // Create the gliding rectangle (narrow with rounded edges)
    // Initially positioned hidden on the far left
    const glidingWidth = rectWidth * 0.15; // 15% of base rectWidth (narrow)
    const glidingHeight = height * 0.5; // 50% of screen height
    const yPosition = (height - glidingHeight) / 2; // Center vertically
    
    this.glidingRect = svg.append('rect')
      .attr('x', -glidingWidth - this.OFF_SCREEN_OFFSET) // Start hidden off-screen to the left
      .attr('y', yPosition)
      .attr('width', glidingWidth)
      .attr('height', glidingHeight)
      .attr('rx', 20) // Rounded corners
      .attr('ry', 20) // Rounded corners
      .attr('fill', '#63A8AF')
      .attr('opacity', 0.7)
      .style('pointer-events', 'none'); // Don't interfere with click detection
    
    this.glidingRectVisible = false;
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

  private cycleGradientColors(gradientIndex: number) {
    // Stagger the start time for each gradient for visual variety
    const delay = gradientIndex * 1000; // 1 second stagger between gradients
    const cycleDuration = 3000; // 3 seconds for smooth color transition
    
    const timeoutId = setTimeout(() => {
      const animateColors = () => {
        if (!this.animationActive) return;
        
        // Select gradient stops
        const stop0 = d3.select(`.stop-0-${gradientIndex}`);
        const stop1 = d3.select(`.stop-1-${gradientIndex}`);
        
        // Get new colors to transition to (ensure they're different)
        const [newColor1, newColor2] = this.getTwoDifferentColors();
        
        // Smoothly transition both gradient stops to new colors
        stop0.transition()
          .duration(cycleDuration)
          .ease(d3.easeLinear)
          .attr('stop-color', newColor1);
        
        stop1.transition()
          .duration(cycleDuration)
          .ease(d3.easeLinear)
          .attr('stop-color', newColor2)
          .on('end', animateColors); // Continue cycling after transition completes
      };
      
      animateColors();
    }, delay) as unknown as number;
    
    // Track timeout for cleanup
    this.colorCycleTimeouts.push(timeoutId);
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private getTwoDifferentColors(): [string, string] {
    // Guard: handle edge case with fewer than 2 colors
    // Note: In this application, we always have 6 colors, so this guard 
    // is purely defensive. If it ever triggers, we return the same color
    // twice, which creates a solid gradient (not ideal but safe).
    if (this.colors.length < 2) {
      const color = this.colors[0] || '#000000';
      return [color, color];
    }
    
    // Select first color
    const index1 = Math.floor(Math.random() * this.colors.length);
    const color1 = this.colors[index1];
    
    // Select second color from remaining colors
    // Generate index from 0 to colors.length-2, then adjust if >= index1
    let index2 = Math.floor(Math.random() * (this.colors.length - 1));
    if (index2 >= index1) {
      index2++; // Skip the first color's index
    }
    const color2 = this.colors[index2];
    
    return [color1, color2];
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

  private onSvgClick() {
    if (!this.glidingRect) return;

    const width = window.innerWidth;
    const rectWidth = width * 0.1;
    const glidingWidth = rectWidth * 0.15;

    if (!this.glidingRectVisible) {
      // Glide from left to between the rectangles on the right
      const targetX = width - (3 * rectWidth) - glidingWidth - this.GLIDING_RECT_SPACING; // Position between left and right rectangles
      
      this.glidingRect
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr('x', targetX);
      
      this.glidingRectVisible = true;
    } else {
      // Glide out to the right side
      this.glidingRect
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr('x', width + this.OFF_SCREEN_OFFSET); // Off-screen to the right
      
      this.glidingRectVisible = false;
    }
  }
}
