import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Order } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderForm implements OnInit {
  orderForm!: FormGroup;
  loading = false;
  
  shippers = [
    { id: 1, name: 'Speedy Express' },
    { id: 2, name: 'United Package' },
    { id: 3, name: 'Federal Shipping' }
  ];
  
  employees = [
    { id: 1, name: 'Nancy Davolio' },
    { id: 2, name: 'Andrew Fuller' },
    { id: 3, name: 'Janet Leverling' },
    { id: 4, name: 'Margaret Peacock' },
    { id: 5, name: 'Steven Buchanan' },
    { id: 6, name: 'Michael Suyama' },
    { id: 7, name: 'Robert King' },
    { id: 8, name: 'Laura Callahan' },
    { id: 9, name: 'Anne Dodsworth' }
  ];
  
  products = [
    { id: 1, name: 'Chai', price: 18.00 },
    { id: 2, name: 'Chang', price: 19.00 },
    { id: 3, name: 'Aniseed Syrup', price: 10.00 },
    { id: 4, name: 'Chef Anton\'s Cajun Seasoning', price: 22.00 },
    { id: 5, name: 'Chef Anton\'s Gumbo Mix', price: 21.35 },
    { id: 6, name: 'Grandma\'s Boysenberry Spread', price: 25.00 },
    { id: 7, name: 'Uncle Bob\'s Organic Dried Pears', price: 30.00 },
    { id: 8, name: 'Northwoods Cranberry Sauce', price: 40.00 },
    { id: 9, name: 'Mishi Kobe Niku', price: 97.00 },
    { id: 10, name: 'Ikura', price: 31.00 }
  ];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<OrderForm>,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { customerId: number, customerName: string }
  ) {}
  
  ngOnInit(): void {
    this.createForm();
  }
  
  createForm(): void {
    const today = new Date();
    const requiredDate = new Date(today);
    requiredDate.setDate(today.getDate() + 7); // 7 días desde hoy
    
    // Inicializar el formulario con los valores predeterminados
    this.orderForm = this.fb.group({
      // Sección de orden
      empId: [1, Validators.required],
      shipperId: [1, Validators.required],
      shipName: [this.data.customerName || '', Validators.required],
      shipAddress: ['', Validators.required],
      shipCity: ['', Validators.required],
      shipCountry: ['', Validators.required],
      orderDate: [today, Validators.required],
      requiredDate: [requiredDate, Validators.required],
      shippedDate: [null],
      freight: [0, Validators.required],
      
      // Sección de detalles de la orden
      productId: [1, Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      discount: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    
    // Si seleccionamos un producto, actualizamos el precio unitario
    this.orderForm.get('productId')?.valueChanges.subscribe(productId => {
      const selectedProduct = this.products.find(p => p.id === productId);
      if (selectedProduct) {
        this.orderForm.get('unitPrice')?.setValue(selectedProduct.price);
      }
    });
    
    // Observar cambios en cantidad y descuento para actualizar el total
    this.orderForm.get('quantity')?.valueChanges.subscribe(() => {
      // El total se recalculará automáticamente
    });
    
    this.orderForm.get('discount')?.valueChanges.subscribe(() => {
      // El total se recalculará automáticamente
    });
  }
  
  onSubmit(): void {
    if (this.orderForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const formValues = this.orderForm.value;
    
    // Buscar el producto seleccionado
    const selectedProduct = this.products.find(p => p.id === formValues.productId);
    
    // Crear un detalle de orden con los datos del producto seleccionado (para el backend)
    const orderDetail = {
      productId: formValues.productId,
      unitPrice: formValues.unitPrice,
      qty: formValues.quantity, // Cambiado de quantity a qty según el nuevo esquema del API
      discount: formValues.discount / 100, // Convertir a decimal
    };
    
    // Crear la nueva orden según la estructura del API
    const newOrder = {
      custId: this.data.customerId, // ID del cliente desde los datos del modal
      empId: formValues.empId,
      // El backend asignará orderDate automáticamente si no lo enviamos
      requiredDate: formValues.requiredDate.toISOString(),
      shipperId: formValues.shipperId,
      freight: formValues.freight,
      shipName: formValues.shipName,
      shipAddress: formValues.shipAddress,
      shipCity: formValues.shipCity,
      shipRegion: '', // Enviamos string vacío para campos opcionales
      shipPostalCode: '', // Enviamos string vacío para campos opcionales
      shipCountry: formValues.shipCountry,
      orderDetails: [orderDetail]
    };
    
    console.log('Enviando orden al servidor:', newOrder);
    
    this.orderService.createOrder(newOrder).subscribe({
      next: (order) => {
        this.loading = false;
        console.log('Orden creada con éxito:', order);
        this.snackBar.open('Orden creada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(order);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creating order:', err);
        this.snackBar.open('Error al crear la orden', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  close(): void {
    this.dialogRef.close();
  }
  
  calculateTotal(): string {
    const unitPrice = this.orderForm.get('unitPrice')?.value || 0;
    const quantity = this.orderForm.get('quantity')?.value || 0;
    const discount = this.orderForm.get('discount')?.value || 0;
    
    const total = unitPrice * quantity * (1 - discount / 100);
    return total.toFixed(2);
  }
}
