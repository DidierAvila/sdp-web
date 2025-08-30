import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { OrderForm } from '../orders/order-form/order-form';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './customer-orders.html',
  styleUrl: './customer-orders.css'
})
export class CustomerOrders implements OnInit {
  customerId!: number;
  customer: Customer | null = null;
  orders: Order[] = [];
  loading = true;
  error = false;
  
  displayedColumns: string[] = ['orderId', 'orderDate', 'status', 'shipCountry', 'details'];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private customerService: CustomerService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.customerId = +params['id'];
      this.loadCustomerDetails();
      this.loadOrders();
    });
  }
  
  loadCustomerDetails(): void {
    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
      },
      error: (err) => {
        console.error('Error loading customer details:', err);
      }
    });
  }
  
  loadOrders(): void {
    this.loading = true;
    this.error = false;
    
    this.orderService.getOrdersByCustomerId(this.customerId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  createNewOrder(): void {
    if (!this.customer) return;
    
    const dialogRef = this.dialog.open(OrderForm, {
      width: '800px',
      data: {
        customerId: this.customerId, // Mantenemos customerId para compatibilidad con el componente
        customerName: this.customer.companyName
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders(); // Recargar las órdenes si se creó una nueva
      }
    });
  }
  
  goBackToCustomers(): void {
    this.router.navigate(['/customers']);
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
  
  getStatusClass(status: string): string {
    if (!status) return '';
    return 'status-' + status.toLowerCase();
  }
}
