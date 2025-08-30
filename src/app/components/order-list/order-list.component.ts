import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { PagedResult } from '../../models/paged-result.model';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogConfig } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// Componentes de modales para órdenes
import { OrderForm } from '../orders/order-form/order-form';
import { OrderDetails } from '../orders/order-details/order-details';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit, AfterViewInit {
  orders: Order[] = [];
  loading = true;
  error = false;
  
  // Table configuration
  displayedColumns: string[] = ['orderId', 'orderDate', 'shipName', 'shipCountry', 'status', 'actions'];
  
  // Pagination
  pageNumber = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtering
  searchTerm = '';
  searchTermUpdate = new Subject<string>();
  
  // Sorting
  sortField = 'orderId';
  sortDirection = 'desc';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) matSort!: MatSort;
  
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadOrders();
    
    // Setup search with debounce
    this.searchTermUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageNumber = 1;
      this.loadOrders();
    });
  }
  
  ngAfterViewInit(): void {
    // If sort or paginator are triggered from the UI
    if (this.matSort) {
      this.matSort.sortChange.subscribe((sort: Sort) => {
        this.sortField = sort.active;
        this.sortDirection = sort.direction;
        this.pageNumber = 1;
        this.loadOrders();
      });
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.error = false;
    
    const params = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      orderBy: this.getSortExpression(),
      searchTerm: this.searchTerm || undefined
    };
    
    console.log('Requesting orders with params:', params);
    
    this.orderService.getOrders(params).subscribe({
      next: (result) => {
        console.log('API Response:', result);
        
        // Verificar la estructura de la respuesta
        if (Array.isArray(result)) {
          // Si es un array directamente
          console.log('Response is an array of orders');
          this.orders = result;
          this.totalItems = result.length;
          this.totalPages = 1;
        } else if (result?.items) {
          // Si es un objeto con una propiedad items
          console.log('Response has items property');
          this.orders = result.items;
          this.totalItems = result.totalCount || result.items.length;
          this.totalPages = result.totalPages || Math.ceil(this.totalItems / this.pageSize);
        } else if (result) {
          // Si es alguna otra estructura, intentar manejarla
          console.log('Unknown response structure:', result);
          // Intentar convertir el objeto en un array si es necesario
          const ordersArray = Object.values(result).filter(item => typeof item === 'object') as Order[];
          if (ordersArray.length > 0) {
            this.orders = ordersArray;
            this.totalItems = ordersArray.length;
            this.totalPages = 1;
          }
        }
        
        console.log('Processed orders:', this.orders);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
      this.loadOrders();
    }
  }
  
  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadOrders();
    }
  }
  
  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadOrders();
    }
  }
  
  // Sorting methods
  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadOrders();
  }
  
  getSortExpression(): string {
    return `${this.sortField} ${this.sortDirection}`;
  }
  
  // Filtering methods
  applyFilter(): void {
    this.searchTermUpdate.next(this.searchTerm);
  }
  
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchTermUpdate.next(this.searchTerm);
  }
  
  clearFilter(): void {
    this.searchTerm = '';
    this.searchTermUpdate.next(this.searchTerm);
  }
  
  // Pagination handling
  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex + 1;
    this.loadOrders();
  }
  
  // Format date
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
  
  // Format status class
  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return 'status-' + status.toLowerCase();
  }
  
  // View order details
  viewOrderDetails(order: Order): void {
    // Verificar que tengamos un ID de orden válido
    if (!order || !order.orderId) {
      console.error('Invalid order or order ID:', order);
      this.snackBar.open('No se puede ver el detalle: ID de orden inválido', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }
    
    console.log(`Opening details for order: ${order.orderId}`);
    
    // Abrimos el diálogo con el componente OrderDetails
    const dialogRef = this.dialog.open(OrderDetails, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        orderId: order.orderId
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      console.log('Order details dialog closed');
    });
  }
  
  // Create new order
  createNewOrder(): void {
    const dialogRef = this.dialog.open(OrderForm, {
      width: '800px',
      data: {
        customerId: null, // No hay un cliente seleccionado en esta vista
        customerName: null
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Order created successfully', 'Close', {
          duration: 3000
        });
        this.loadOrders();
      }
    });
  }
}
