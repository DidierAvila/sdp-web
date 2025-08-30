import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { PredictionService, SalesPrediction as SalesPredictionModel } from '../../services/prediction.service';

@Component({
  selector: 'app-sales-prediction',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './sales-prediction.html',
  styleUrl: './sales-prediction.css'
})
export class SalesPredictionComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['customerName', 'lastOrderDate', 'averageDaysBetweenOrders', 'nextPredictedOrder', 'actions'];
  dataSource = new MatTableDataSource<SalesPredictionModel>([]);
  loading = true;
  error = false;
  searchTerm = '';
  
  // Parámetros de paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Parámetros de ordenación
  currentSortField = 'customerName';
  currentSortDirection = 'asc';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<SalesPredictionModel>;
  
  constructor(
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnInit(): void {
    this.loadPredictions();
  }
  
  ngAfterViewInit(): void {
    // Configurar la tabla para usar el paginador y el ordenador
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configurar eventos de paginación y ordenación
    if (this.paginator) {
      this.paginator.page.subscribe(() => {
        this.loadPredictions();
      });
    }
    
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.pageIndex = 0; // Volver a la primera página al ordenar
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadPredictions();
      });
    }
    
    // Forzar la detección de cambios
    this.cdr.detectChanges();
  }
  
  loadPredictions(): void {
    this.loading = true;
    this.error = false;
    
    // Configurar parámetros para la API
    const params = {
      pageNumber: this.pageIndex + 1, // Ajustar porque la API usa 1-based indexing
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      orderBy: this.sort?.active ? `${this.sort.active} ${this.sort.direction}` : undefined
    };
    
    this.predictionService.getSalesPredictions(params).subscribe({
      next: (result) => {
        console.log('Predictions loaded:', result);
        
        // Depuración detallada de la respuesta
        if (result) {
          console.log('Tipo de resultado:', typeof result);
          console.log('Propiedades del resultado:', Object.keys(result));
          
          if (result.items) {
            console.log('Número de elementos:', result.items.length);
            console.log('Primer elemento:', result.items[0]);
          } else {
            console.warn('No se encontró la propiedad "items" en el resultado');
            
            // Verificar si el resultado es un array directamente
            if (Array.isArray(result)) {
              console.log('El resultado es un array con', result.length, 'elementos');
              this.dataSource.data = result;
              this.totalItems = result.length;
            } else if (typeof result === 'object') {
              // Intentar determinar la estructura del resultado
              const possibleArrayProps = Object.keys(result).filter(key => 
                Array.isArray((result as any)[key])
              );
              
              console.log('Propiedades que contienen arrays:', possibleArrayProps);
              
              if (possibleArrayProps.length > 0) {
                const firstArrayProp = possibleArrayProps[0];
                console.log(`Usando propiedad "${firstArrayProp}" como fuente de datos`);
                this.dataSource.data = (result as any)[firstArrayProp];
                this.totalItems = this.dataSource.data.length;
              }
            }
          }
        } else {
          console.warn('El resultado es nulo o indefinido');
        }
        
        // Asignar datos si se encontraron en la estructura esperada
        if (result && result.items) {
          this.dataSource.data = result.items;
          this.totalItems = result.totalCount;
        }
        
        this.loading = false;
        // Forzar la detección de cambios
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading predictions:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue;
    this.pageIndex = 0; // Volver a la primera página al filtrar
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadPredictions();
  }
  
  clearFilter(): void {
    this.searchTerm = '';
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadPredictions();
  }
  
  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPredictions();
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  daysUntilNextOrder(nextOrderDate: string): number {
    const today = new Date();
    const nextDate = new Date(nextOrderDate);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  getStatusClass(nextOrderDate: string): string {
    const daysRemaining = this.daysUntilNextOrder(nextOrderDate);
    
    if (daysRemaining < 0) {
      return 'status-overdue';
    } else if (daysRemaining <= 7) {
      return 'status-upcoming';
    } else {
      return 'status-future';
    }
  }
}
