import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css'
})
export class CustomerFormComponent implements OnInit {
  customerForm!: FormGroup;
  isEditMode = false;
  customerId: number | null = null;
  loading = false;
  submitted = false;
  
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.customerId = +id;
      this.loadCustomer(this.customerId);
    }
  }
  
  initForm(): void {
    this.customerForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      contactName: ['', Validators.required],
      contactTitle: [''],
      address: [''],
      city: [''],
      region: [''],
      postalCode: [''],
      country: [''],
      phone: ['', [Validators.pattern(/^[0-9\\+\\-\\s]+$/)]],
      fax: ['']
    });
  }
  
  loadCustomer(id: number): void {
    this.loading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.customerForm.patchValue({
          companyName: customer.companyName,
          contactName: customer.contactName,
          contactTitle: customer.contactTitle,
          address: customer.address,
          city: customer.city,
          region: customer.region,
          postalCode: customer.postalCode,
          country: customer.country,
          phone: customer.phone,
          fax: customer.fax
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customer', err);
        alert('Could not load customer details. Redirecting to customers list.');
        this.router.navigate(['/customers']);
        this.loading = false;
      }
    });
  }
  
  onSubmit(): void {
    this.submitted = true;
    
    if (this.customerForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const customerData: Customer = {
      ...this.customerForm.value,
      custId: this.isEditMode && this.customerId ? this.customerId : Math.floor(Math.random() * 1000) + 100 // For demo purposes
    };
    
    if (this.isEditMode && this.customerId) {
      this.customerService.updateCustomer(customerData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Customer updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/customers']);
        },
        error: (err) => {
          console.error('Error updating customer', err);
          this.snackBar.open('Error updating customer. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    } else {
      this.customerService.createCustomer(customerData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Customer created successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/customers']);
        },
        error: (err) => {
          console.error('Error creating customer', err);
          this.snackBar.open('Error creating customer. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }
}
