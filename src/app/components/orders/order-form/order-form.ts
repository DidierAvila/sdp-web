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
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';

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
  loadingCustomers = false;
  
  customers: Customer[] = [];
  
  // Array para almacenar los detalles de productos de la orden
  orderDetails: Array<{
    productId: number;
    unitPrice: number;
    qty: number;
    discount: number;
    subtotal?: number;
  }> = [];
  
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
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { customerId?: number, customerName?: string }
  ) {}
  
  ngOnInit(): void {
    this.createForm();
    this.loadCustomers();
  }
  
  loadCustomers(): void {
    this.loadingCustomers = true;
    this.customerService.getCustomers({ pageSize: 100 }).subscribe({
      next: (response) => {
        this.customers = response.items || response;
        this.loadingCustomers = false;
        
        // Si ya tenemos un customer seleccionado en los datos del modal, seleccionarlo en el formulario
        if (this.data?.customerId && this.orderForm) {
          this.orderForm.get('custId')?.setValue(this.data.customerId);
          this.updateCustomerInfo(this.data.customerId);
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loadingCustomers = false;
        this.snackBar.open('Error loading customers. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
  
  createForm(): void {
    const today = new Date();
    const requiredDate = new Date(today);
    requiredDate.setDate(today.getDate() + 7); // 7 días desde hoy
    
    // Inicializar el formulario con los valores predeterminados
    this.orderForm = this.fb.group({
      // Sección de orden
      custId: [this.data?.customerId || null, Validators.required],
      empId: [1, Validators.required],
      shipperId: [1, Validators.required],
      shipName: [this.data?.customerName || '', Validators.required],
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
    
    // Si seleccionamos un cliente, actualizamos la información de envío
    this.orderForm.get('custId')?.valueChanges.subscribe(custId => {
      this.updateCustomerInfo(custId);
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
  
  updateCustomerInfo(custId: number): void {
    if (!custId) return;
    
    const selectedCustomer = this.customers.find(c => c.custId === custId);
    if (selectedCustomer) {
      // Actualiza los campos de envío con la información del cliente seleccionado
      this.orderForm.patchValue({
        shipName: selectedCustomer.companyName,
        shipAddress: selectedCustomer.address,
        shipCity: selectedCustomer.city,
        shipCountry: selectedCustomer.country
      });
    }
  }
  
  // Método para agregar un producto a la lista de detalles
  addProduct(): void {
    if (this.orderForm.get('productId')?.invalid || 
        this.orderForm.get('unitPrice')?.invalid || 
        this.orderForm.get('quantity')?.invalid || 
        this.orderForm.get('discount')?.invalid) {
      this.snackBar.open('Por favor, complete todos los campos del producto', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const formValues = this.orderForm.value;
    const selectedProduct = this.products.find(p => p.id === formValues.productId);
    
    if (!selectedProduct) {
      this.snackBar.open('Producto no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Crear un detalle de producto
    const orderDetail = {
      productId: formValues.productId,
      unitPrice: formValues.unitPrice,
      qty: formValues.quantity,
      discount: formValues.discount / 100, // Convertir a decimal para guardar
      subtotal: formValues.unitPrice * formValues.quantity * (1 - formValues.discount / 100)
    };
    
    // Agregar el producto a la lista
    this.orderDetails.push(orderDetail);
    
    // Limpiar el formulario para el siguiente producto
    this.resetProductForm();
    
    this.snackBar.open(`Producto "${selectedProduct.name}" agregado`, 'Cerrar', { duration: 2000 });
  }
  
  // Método para eliminar un producto de la lista
  removeProduct(index: number): void {
    this.orderDetails.splice(index, 1);
    this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 2000 });
  }
  
  // Reiniciar los campos del formulario de producto
  resetProductForm(): void {
    this.orderForm.patchValue({
      productId: 1,
      unitPrice: this.products[0].price,
      quantity: 1,
      discount: 0
    });
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      return;
    }
    
    if (this.orderDetails.length === 0) {
      // Si no hay productos agregados, agregamos el actual
      this.addProduct();
    }
    
    if (this.orderDetails.length === 0) {
      this.snackBar.open('Debe agregar al menos un producto', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.loading = true;
    
    const formValues = this.orderForm.value;
    
    // Crear la nueva orden según la estructura del API
    const newOrder = {
      custId: formValues.custId, // ID del cliente seleccionado por el usuario desde el dropdown
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
      orderDetails: this.orderDetails.map(detail => ({
        productId: detail.productId,
        unitPrice: detail.unitPrice,
        qty: detail.qty,
        discount: detail.discount // Ya está convertido a decimal
      }))
    };
    
    // Asegurarnos de que custId no sea null
    if (!newOrder.custId) {
      this.snackBar.open('Please select a customer before submitting', 'Close', { duration: 3000 });
      this.loading = false;
      return;
    }
    
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
  
  // Calcula el subtotal del producto actual en el formulario
  calculateSubtotal(): string {
    const unitPrice = this.orderForm.get('unitPrice')?.value || 0;
    const quantity = this.orderForm.get('quantity')?.value || 0;
    const discount = this.orderForm.get('discount')?.value || 0;
    
    const subtotal = unitPrice * quantity * (1 - discount / 100);
    return subtotal.toFixed(2);
  }
  
  // Calcula el total de todos los productos agregados
  calculateTotal(): string {
    if (this.orderDetails.length === 0) {
      return this.calculateSubtotal();
    }
    
    const total = this.orderDetails.reduce((sum, detail) => sum + detail.subtotal!, 0);
    return total.toFixed(2);
  }
  
  // Obtener el nombre del producto por ID
  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Producto desconocido';
  }
}
