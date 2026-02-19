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
  controlsVisible = false;

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
    const rectWidth = width * 0.2;

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
    const createGradient = (id: string, index: number) => {
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      // Randomly decide between 2-stop and 3-stop gradients (33% chance for 3-stop, 67% for 2-stop)
      const use3Stops = Math.random() < 0.33;

      if (use3Stops) {
        const [color1, color2, color3] = this.getThreeDifferentColors();

        gradient.append('stop')
          .attr('class', `stop-0-${index}`)
          .attr('offset', '0%')
          .attr('stop-color', color1);

        gradient.append('stop')
          .attr('class', `stop-1-${index}`)
          .attr('offset', '50%')
          .attr('stop-color', color2);

        gradient.append('stop')
          .attr('class', `stop-2-${index}`)
          .attr('offset', '100%')
          .attr('stop-color', color3);
      } else {
        const [color1, color2] = this.getTwoDifferentColors();

        gradient.append('stop')
          .attr('class', `stop-0-${index}`)
          .attr('offset', '0%')
          .attr('stop-color', color1);

        gradient.append('stop')
          .attr('class', `stop-1-${index}`)
          .attr('offset', '100%')
          .attr('stop-color', color2);
      }
      
      // Start color cycling animation for this gradient
      this.cycleGradientColors(index, use3Stops);
    };

    // Create gradients for all rectangles
    for (let i = 0; i < 4; i++) {
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
      const wave = Math.sin((i / segments) * waveFrequency * Math.PI / 1.2 + wavePhase) * waveAmplitude;
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
      const wave = Math.sin((i / segments) * waveFrequency * Math.PI / 1.2 + wavePhase) * waveAmplitude;
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
    const baseDuration = 3000 + (index * 500); // Duration for full oscillation cycle
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    
    // For seamless undulation, track elapsed time instead of discrete phase
    const startTime = Date.now();
    // Wave speed: determines how fast the wave pattern flows (radians per millisecond)
    const waveSpeed = 0.001; // Adjust this to control wave flow speed
    
    const animate = () => {
      if (!this.animationActive) return;
      
      // Calculate phase once per animation cycle for efficiency
      const cycleStartTime = Date.now();
      
      // Single continuous transition with sine wave oscillation
      rect.transition()
        .duration(duration)
        .ease(d3.easeLinear) // Use linear easing for the oscillation calculation
        .attrTween('d', () => {
          return (t: number) => {
            // Use sine wave for smooth up-and-down oscillation
            const oscillation = Math.sin(t * Math.PI * 2) * oscillationAmount;
            const currentWidth = baseWidth + oscillation;
            
            // Calculate phase based on total elapsed time and current position in transition
            const elapsedTime = (cycleStartTime - startTime) + (t * duration);
            const currentPhase = elapsedTime * waveSpeed;
            return this.createLeftWavyPath(currentWidth, height, currentPhase);
          };
        })
        .on('end', animate);
    };
    
    animate();
  }

  private animateRightRectangle(rect: any, width: number, multiplier: number, rectWidth: number, height: number) {
    const baseX = width - multiplier * rectWidth;
    const oscillationAmount = rectWidth * 0.15; // 15% oscillation
    const baseDuration = 3000 + (multiplier * 500); // Duration for full oscillation cycle
    const duration = baseDuration / this.animationSpeed; // Adjust by speed multiplier
    
    // For seamless undulation, track elapsed time instead of discrete phase
    const startTime = Date.now();
    // Wave speed: determines how fast the wave pattern flows (radians per millisecond)
    const waveSpeed = 0.001; // Adjust this to control wave flow speed
    
    const animate = () => {
      if (!this.animationActive) return;
      
      // Calculate phase once per animation cycle for efficiency
      const cycleStartTime = Date.now();
      
      // Single continuous transition with sine wave oscillation
      rect.transition()
        .duration(duration)
        .ease(d3.easeLinear) // Use linear easing for the oscillation calculation
        .attrTween('d', () => {
          return (t: number) => {
            // Use sine wave for smooth up-and-down oscillation
            const oscillation = Math.sin(t * Math.PI * 2) * oscillationAmount;
            const currentX = baseX - oscillation;
            
            // Calculate phase based on total elapsed time and current position in transition
            const elapsedTime = (cycleStartTime - startTime) + (t * duration);
            const currentPhase = elapsedTime * waveSpeed;
            return this.createRightWavyPath(currentX, width, height, currentPhase);
          };
        })
        .on('end', animate);
    };
    
    animate();
  }

  private cycleGradientColors(gradientIndex: number, has3Stops: boolean) {
    // Stagger the start time for each gradient for visual variety
    const delay = gradientIndex * 1000; // 1 second stagger between gradients
    const cycleDuration = 3000; // 3 seconds for smooth color transition
    
    const timeoutId = setTimeout(() => {
      const animateColors = () => {
        if (!this.animationActive) return;
        
        // Select gradient stops
        const stop0 = d3.select(`.stop-0-${gradientIndex}`);
        const stop1 = d3.select(`.stop-1-${gradientIndex}`);
        
        if (has3Stops) {
          const stop2 = d3.select(`.stop-2-${gradientIndex}`);
          
          // Get new colors to transition to (ensure they're different)
          const [newColor1, newColor2, newColor3] = this.getThreeDifferentColors();
          
          // Smoothly transition all three gradient stops to new colors
          stop0.transition()
            .duration(cycleDuration)
            .ease(d3.easeLinear)
            .attr('stop-color', newColor1);
          
          stop1.transition()
            .duration(cycleDuration)
            .ease(d3.easeLinear)
            .attr('stop-color', newColor2);
          
          stop2.transition()
            .duration(cycleDuration)
            .ease(d3.easeLinear)
            .attr('stop-color', newColor3)
            .on('end', animateColors); // Continue cycling after transition completes
        } else {
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
        }
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

  private getThreeDifferentColors(): [string, string, string] {
    // Guard: handle edge case with fewer than 3 colors
    if (this.colors.length < 3) {
      const color = this.colors[0] || '#000000';
      return [color, color, color];
    }
    
    // Select first color
    const index1 = Math.floor(Math.random() * this.colors.length);
    const color1 = this.colors[index1];
    
    // Select second color from remaining colors
    let index2 = Math.floor(Math.random() * (this.colors.length - 1));
    if (index2 >= index1) {
      index2++; // Skip the first color's index
    }
    const color2 = this.colors[index2];
    
    // Select third color from remaining colors (excluding both index1 and index2)
    // Create array of available indices excluding index1 and index2
    const availableIndices = this.colors.map((_, i) => i).filter(i => i !== index1 && i !== index2);
    const index3 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const color3 = this.colors[index3];
    
    return [color1, color2, color3];
  }

  private onResize() {
    this.createVisualization();
  }

  toggleControls() {
    this.controlsVisible = !this.controlsVisible;
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
