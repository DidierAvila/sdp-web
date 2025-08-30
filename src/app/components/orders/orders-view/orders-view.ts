import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Order } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';
import { OrderDetails } from '../order-details/order-details';

@Component({
  selector: 'app-orders-view',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './orders-view.html',
  styleUrl: './orders-view.css'
})
export class OrdersView implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = false;
  displayedColumns: string[] = ['orderId', 'orderDate', 'status', 'shipCountry', 'details'];
  
  constructor(
    private dialogRef: MatDialogRef<OrdersView>,
    private orderService: OrderService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { customerId: number, customerName: string }
  ) {}
  
  ngOnInit(): void {
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.loading = true;
    this.error = false;
    
    this.orderService.getOrdersByCustomerId(this.data.customerId).subscribe({
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
  
  close(): void {
    this.dialogRef.close();
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
  
  viewOrderDetails(order: Order): void {
    // Verificar que tengamos un ID de orden válido
    if (!order || !order.orderId) {
      console.error('Invalid order or order ID:', order);
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
}
