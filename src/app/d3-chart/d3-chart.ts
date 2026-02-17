import { Component, OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-d3-chart',
  imports: [],
  templateUrl: './d3-chart.html',
  styleUrl: './d3-chart.css',
})
export class D3Chart implements OnInit {
  private readonly CHART_WIDTH = 500;
  private readonly CHART_HEIGHT = 300;
  
  private data = [
    { name: 'A', value: 30 },
    { name: 'B', value: 80 },
    { name: 'C', value: 45 },
    { name: 'D', value: 60 },
    { name: 'E', value: 20 },
    { name: 'F', value: 90 },
  ];

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const element = this.elementRef.nativeElement;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = this.CHART_WIDTH - margin.left - margin.right;
    const height = this.CHART_HEIGHT - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(element)
      .select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3
      .scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(this.data.map((d) => d.name));

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(this.data, (d) => d.value) || 100]);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    svg.append('g').call(d3.axisLeft(y));

    // Add bars
    svg
      .selectAll('.bar')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.name) || 0)
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.value))
      .attr('fill', '#4285f4');
  }
}
