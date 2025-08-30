import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
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
import { OrdersView } from '../orders/orders-view/orders-view';
import { OrderForm } from '../orders/order-form/order-form';

@Component({
  selector: 'app-customer-list',
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
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit, AfterViewInit {
  customers: Customer[] = [];
  loading = true;
  error = false;
  
  // Table configuration
  displayedColumns: string[] = ['custId', 'companyName', 'contactName', 'country', 'phone', 'actions'];
  
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
  sortField = 'companyName';
  sortDirection = 'asc';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) matSort!: MatSort;
  
  private customerService = inject(CustomerService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadCustomers();
    
    // Setup search with debounce
    this.searchTermUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageNumber = 1;
      this.loadCustomers();
    });
  }
  
  ngAfterViewInit(): void {
    // If sort or paginator are triggered from the UI
    if (this.matSort) {
      this.matSort.sortChange.subscribe((sort: Sort) => {
        this.sortField = sort.active;
        this.sortDirection = sort.direction;
        this.pageNumber = 1;
        this.loadCustomers();
      });
    }
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = false;
    
    const params = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      orderBy: this.getSortExpression(),
      searchTerm: this.searchTerm || undefined
    };
    
    this.customerService.getCustomers(params).subscribe({
      next: (result) => {
        console.log('API Response:', result);
        this.customers = result?.items || [];
        this.totalItems = result?.totalCount || 0;
        this.totalPages = result?.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customers', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  deleteCustomer(custId: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(custId).subscribe({
        next: () => {
          this.customers = this.customers.filter(customer => customer.custId !== custId);
          if (this.customers.length === 0 && this.pageNumber > 1) {
            this.pageNumber--;
            this.loadCustomers();
          }
          this.snackBar.open('Customer deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: (err) => {
          console.error('Error deleting customer', err);
          this.snackBar.open('Error deleting customer. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
  
  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
      this.loadCustomers();
    }
  }
  
  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadCustomers();
    }
  }
  
  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadCustomers();
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
    this.loadCustomers();
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
    
  }
  
  // Modal methods
  viewOrders(customer: Customer): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '800px';
    dialogConfig.data = { 
      customerId: customer.custId,
      customerName: customer.companyName
    };
    
    this.dialog.open(OrdersView, dialogConfig);
  }
  
  createNewOrder(customer: Customer): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '800px';
    dialogConfig.data = { 
      customerId: customer.custId,
      customerName: customer.companyName
    };
    
    const dialogRef = this.dialog.open(OrderForm, dialogConfig);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open(`Orden creada para ${customer.companyName}`, 'Cerrar', {
          duration: 3000
        });
      }
    });
    this.loadCustomers();
  }
}
