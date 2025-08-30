import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerFormComponent } from './components/customer-form/customer-form.component';
import { CustomerOrders } from './components/customer-orders/customer-orders';
import { Component } from '@angular/core';
import { OrderListComponent } from './components/order-list/order-list.component';
import { SalesPredictionComponent } from './components/sales-prediction/sales-prediction';
import { GraphicsComponent } from './components/graphics/graphics.component';

// Componente temporal para la ruta de gráficos
@Component({
  template: `
    <div style="padding: 20px; text-align: center;">
      <h1>Gráficos y Estadísticas</h1>
      <p>Esta página mostrará gráficos y estadísticas de ventas.</p>
      <p>Funcionalidad en desarrollo...</p>
    </div>
  `,
  standalone: true
})
export class GraphicsPlaceholder {}

export const routes: Routes = [
  { path: '', redirectTo: '/customers', pathMatch: 'full' },
  { path: 'customers', component: CustomerListComponent },
  { path: 'customers/new', component: CustomerFormComponent },
  { path: 'customers/:id/edit', component: CustomerFormComponent },
  { path: 'customers/:id/orders', component: CustomerOrders },
  { path: 'orders', component: OrderListComponent },
  { path: 'predictions', component: SalesPredictionComponent },
  { path: 'graphics', component: GraphicsComponent },
  { path: '**', redirectTo: '/customers' }
];
