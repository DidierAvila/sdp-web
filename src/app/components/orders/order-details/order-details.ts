import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails implements OnInit {
  orderDetails: any = null;
  loading = true;
  error = false;
  displayedColumns: string[] = ['productName', 'unitPrice', 'quantity', 'discount', 'total'];
  
  constructor(
    private dialogRef: MatDialogRef<OrderDetails>,
    private orderService: OrderService,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: number }
  ) {}
  
  ngOnInit(): void {
    this.loadOrderDetails();
  }
  
  loadOrderDetails(): void {
    this.loading = true;
    this.error = false;
    
    this.orderService.getOrderDetails(this.data.orderId).subscribe({
      next: (details) => {
        console.log('Order details received:', details);
        
        // Normalizar los datos según diferentes formatos de respuesta posibles
        if (details) {
          // Caso 1: Si ya viene con el formato esperado
          if (details.details || details.orderDetails) {
            this.orderDetails = {
              orderId: details.orderId,
              customerName: details.customerName || details.shipName,
              orderDate: details.orderDate,
              requiredDate: details.requiredDate,
              shippedDate: details.shippedDate,
              shipAddress: details.shipAddress,
              shipCity: details.shipCity,
              shipCountry: details.shipCountry,
              details: details.details || details.orderDetails
            };
          } 
          // Caso 2: Si es una orden directamente
          else if (details.orderId && Array.isArray(details.orderDetails)) {
            this.orderDetails = {
              orderId: details.orderId,
              customerName: details.shipName || details.customer?.companyName,
              orderDate: details.orderDate,
              requiredDate: details.requiredDate,
              shippedDate: details.shippedDate,
              shipAddress: details.shipAddress,
              shipCity: details.shipCity,
              shipCountry: details.shipCountry,
              details: details.orderDetails
            };
          }
          // Caso 3: Si es un arreglo de detalles directamente
          else if (Array.isArray(details)) {
            this.orderDetails = {
              orderId: this.data.orderId,
              customerName: 'Cliente',
              orderDate: new Date().toISOString(),
              details: details
            };
          }
          // Caso 4: Formato desconocido
          else {
            console.warn('Unknown response format:', details);
            this.orderDetails = {
              orderId: this.data.orderId,
              customerName: 'Cliente',
              orderDate: new Date().toISOString(),
              details: []
            };
          }
        }
        
        console.log('Normalized order details:', this.orderDetails);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  close(): void {
    this.dialogRef.close();
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  }
  
  formatCurrency(value: number): string {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  }
  
  calculateTotal(detail: any): number {
    if (!detail) return 0;
    
    // Intentar obtener la cantidad (puede estar como quantity o qty)
    const quantity = detail.quantity || detail.qty || 0;
    
    // Intentar obtener el precio unitario
    const unitPrice = detail.unitPrice || 0;
    
    // Intentar obtener el descuento (puede estar como decimal o porcentaje)
    let discount = detail.discount || 0;
    
    // Si el descuento es mayor que 1, asumimos que es un porcentaje y lo convertimos a decimal
    if (discount > 1) {
      discount = discount / 100;
    }
    
    // Calcular el total
    const total = unitPrice * quantity * (1 - discount);
    console.log(`Calculating total for product: unitPrice=${unitPrice}, quantity=${quantity}, discount=${discount}, total=${total}`);
    
    return total;
  }
  
  calculateOrderTotal(): number {
    if (!this.orderDetails || !this.orderDetails.details) return 0;
    
    let total = 0;
    
    try {
      total = this.orderDetails.details.reduce((sum: number, detail: any) => {
        const itemTotal = this.calculateTotal(detail);
        return sum + itemTotal;
      }, 0);
      
      console.log(`Order total: ${total}`);
    } catch (error) {
      console.error('Error calculating order total:', error);
    }
    
    return total;
  }
}
