import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import * as d3 from 'd3';

@Component({
  selector: 'app-graphics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule
  ],
  templateUrl: './graphics.component.html',
  styleUrls: ['./graphics.component.css']
})
export class GraphicsComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') private chartContainer!: ElementRef;
  
  sourceData: string = '4,8,15,16';
  chartData: number[] = [];
  colors: string[] = ['#3498db', '#2980b9', '#1abc9c', '#16a085', '#27ae60'];
  
  constructor() { }
  
  ngOnInit(): void {
    // Inicializar con datos de ejemplo
    this.parseSourceData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createChart();
    }, 0);
  }
  
  parseSourceData(): void {
    // Validar y convertir los datos de entrada
    if (!this.sourceData) {
      this.chartData = [];
      return;
    }
    
    try {
      // Dividir por comas y convertir a números
      this.chartData = this.sourceData
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(item => {
          const num = Number(item);
          if (isNaN(num)) {
            throw new Error(`"${item}" no es un número válido`);
          }
          return num;
        });
    } catch (error) {
      console.error('Error al procesar los datos:', error);
      alert('Error: Por favor, ingrese solo números separados por comas');
      this.chartData = [];
    }
  }
  
  updateData(): void {
    this.parseSourceData();
    this.createChart();
  }
  
  createChart(): void {
    if (this.chartData.length === 0) return;
    
    const element = this.chartContainer.nativeElement;
    
    // Limpiar cualquier gráfico existente
    d3.select(element).selectAll('*').remove();
    
    // Configuración del gráfico
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Crear SVG
    const svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Escalas
    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(this.chartData.map((d, i) => i.toString()));
    
    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(this.chartData) || 0]);
    
    // Crear barras con colores diferentes
    svg.selectAll('.bar')
      .data(this.chartData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => x(i.toString()) || 0)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d))
      .attr('height', d => height - y(d))
      .attr('fill', (d, i) => this.getColor(i))
      .attr('rx', 3) // Esquinas redondeadas
      .attr('ry', 3);
    
    // Agregar valores en las barras
    svg.selectAll('.label')
      .data(this.chartData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', (d, i) => (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d)
      .attr('fill', 'white');
  }
  
  getColor(index: number): string {
    // Asegurar que barras contiguas no tengan el mismo color
    if (index > 0) {
      let color = this.colors[index % this.colors.length];
      const prevColor = this.getColor(index - 1);
      
      // Si es el mismo color, usar el siguiente
      if (color === prevColor) {
        color = this.colors[(index + 1) % this.colors.length];
      }
      
      return color;
    }
    
    return this.colors[0];
  }
}
