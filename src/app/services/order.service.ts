import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, delay } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://localhost:7085/Order';
  private orders = signal<Order[]>([]);
  
  // Lista de productos de ejemplo para usar cuando se generan datos de prueba
  private products = [
    { id: 1, name: 'Chai' },
    { id: 2, name: 'Chang' },
    { id: 3, name: 'Aniseed Syrup' },
    { id: 4, name: 'Chef Anton\'s Cajun Seasoning' },
    { id: 5, name: 'Chef Anton\'s Gumbo Mix' },
    { id: 6, name: 'Grandma\'s Boysenberry Spread' },
    { id: 7, name: 'Uncle Bob\'s Organic Dried Pears' },
    { id: 8, name: 'Northwoods Cranberry Sauce' },
    { id: 9, name: 'Mishi Kobe Niku' },
    { id: 10, name: 'Ikura' },
    { id: 11, name: 'Queso Cabrales' },
    { id: 14, name: 'Tofu' },
    { id: 41, name: 'Jack\'s New England Clam Chowder' },
    { id: 42, name: 'Singaporean Hokkien Fried Mee' },
    { id: 51, name: 'Manjimup Dried Apples' }
  ];
  
  // Datos de muestra para usar cuando el backend no está disponible
  private mockOrders: Order[] = [
    {
      orderId: 10248,
      custId: 1,
      empId: 5,
      orderDate: '2023-07-04T00:00:00',
      requiredDate: '2023-07-12T00:00:00',
      shippedDate: '2023-07-16T00:00:00',
      shipperId: 3,
      freight: 32.38,
      shipName: 'Alfreds Futterkiste',
      shipAddress: 'Obere Str. 57',
      shipCity: 'Berlin',
      shipRegion: '',
      shipPostalCode: '12209',
      shipCountry: 'Germany',
      status: 'Delivered',
      orderDetails: [
        {
          orderDetailId: 1,
          orderId: 10248,
          productId: 11,
          unitPrice: 14,
          quantity: 12,
          discount: 0,
          product: {
            productId: 11,
            productName: 'Queso Cabrales'
          }
        },
        {
          orderDetailId: 2,
          orderId: 10248,
          productId: 42,
          unitPrice: 9.8,
          quantity: 10,
          discount: 0,
          product: {
            productId: 42,
            productName: 'Singaporean Hokkien Fried Mee'
          }
        }
      ]
    },
    {
      orderId: 10249,
      custId: 1,
      empId: 6,
      orderDate: '2023-07-05T00:00:00',
      requiredDate: '2023-08-16T00:00:00',
      shippedDate: '2023-07-10T00:00:00',
      shipperId: 1,
      freight: 11.61,
      shipName: 'Alfreds Futterkiste',
      shipAddress: 'Obere Str. 57',
      shipCity: 'Berlin',
      shipRegion: '',
      shipPostalCode: '12209',
      shipCountry: 'Germany',
      status: 'Delivered',
      orderDetails: [
        {
          orderDetailId: 3,
          orderId: 10249,
          productId: 14,
          unitPrice: 18.6,
          quantity: 9,
          discount: 0,
          product: {
            productId: 14,
            productName: 'Tofu'
          }
        },
        {
          orderDetailId: 4,
          orderId: 10249,
          productId: 51,
          unitPrice: 42.4,
          quantity: 40,
          discount: 0,
          product: {
            productId: 51,
            productName: 'Manjimup Dried Apples'
          }
        }
      ]
    },
    {
      orderId: 10250,
      custId: 2,
      empId: 4,
      orderDate: '2023-07-08T00:00:00',
      requiredDate: '2023-08-05T00:00:00',
      shippedDate: '2023-07-12T00:00:00',
      shipperId: 2,
      freight: 65.83,
      shipName: 'Ana Trujillo Emparedados y helados',
      shipAddress: 'Avda. de la Constitución 2222',
      shipCity: 'México D.F.',
      shipRegion: '',
      shipPostalCode: '05021',
      shipCountry: 'Mexico',
      status: 'Delivered',
      orderDetails: [
        {
          orderDetailId: 5,
          orderId: 10250,
          productId: 41,
          unitPrice: 7.7,
          quantity: 10,
          discount: 0,
          product: {
            productId: 41,
            productName: 'Jack\'s New England Clam Chowder'
          }
        }
      ]
    }
  ];

  constructor(private http: HttpClient) { }

  getOrders(params: any = {}): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        console.log('API orders response:', response);
        console.log('API response type:', typeof response);
        if (response) {
          console.log('API response structure:', Object.keys(response));
        }
        
        // Manejar diferentes estructuras de respuesta
        if (Array.isArray(response)) {
          // Si la API devuelve un array directamente
          return {
            items: response,
            totalCount: response.length,
            totalPages: 1,
            pageSize: response.length,
            currentPage: 1
          };
        } else {
          // Si la API devuelve un objeto con estructura ya establecida
          return response;
        }
      }),
      catchError(error => {
        console.error('Error fetching orders:', error);
        
        // En caso de error, devolver datos mock con paginación
        let filteredOrders = [...this.mockOrders];
        
        // Aplicar búsqueda si hay un término
        if (params.searchTerm) {
          const search = params.searchTerm.toLowerCase();
          filteredOrders = filteredOrders.filter(order => 
            order.shipName?.toLowerCase().includes(search) || 
            order.shipCountry?.toLowerCase().includes(search) ||
            order.orderId.toString().includes(search)
          );
        }
        
        // Aplicar ordenación
        if (params.orderBy) {
          const [field, direction] = params.orderBy.split(' ');
          filteredOrders.sort((a: any, b: any) => {
            const valueA = a[field] !== null && a[field] !== undefined ? a[field] : '';
            const valueB = b[field] !== null && b[field] !== undefined ? b[field] : '';
            
            if (typeof valueA === 'string') {
              return direction === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
            } else {
              return direction === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
            }
          });
        }
        
        // Calcular paginación
        const pageSize = params.pageSize || 10;
        const pageNumber = params.pageNumber || 1;
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        const mockResponse = {
          items: paginatedOrders,
          totalCount: filteredOrders.length,
          totalPages: Math.ceil(filteredOrders.length / pageSize),
          pageSize: pageSize,
          currentPage: pageNumber,
          hasNextPage: pageNumber < Math.ceil(filteredOrders.length / pageSize),
          hasPreviousPage: pageNumber > 1
        };
        
        return of(mockResponse).pipe(delay(300));
      })
    );
  }

  getOrdersByCustomerId(customerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer/${customerId}`).pipe(
      catchError(error => {
        console.error(`Error fetching orders for customer ${customerId}:`, error);
        
        // En caso de error, devolver datos mock filtrados por customerId
        const filteredOrders = this.mockOrders.filter(o => o.custId === customerId);
        console.log(`Providing ${filteredOrders.length} mock orders for customer ${customerId}`);
        
        return of(filteredOrders).pipe(delay(300));
      })
    );
  }

  // Método para obtener los detalles de una orden específica
  getOrderDetails(orderId: number): Observable<any> {
    console.log(`Fetching order details for order ${orderId}`);
    
    const baseUrl = this.apiUrl.substring(0, this.apiUrl.lastIndexOf('/'));
    
    // Primera opción: URL con formato /OrderDetail/order/{id}
    return this.http.get<any>(`${baseUrl}/OrderDetail/order/${orderId}`).pipe(
      tap(details => console.log('Order details response from first URL:', details)),
      catchError(error1 => {
        console.warn(`Error with first URL format, trying alternative: ${error1.message}`);
        
        // Segunda opción: intentar con URL en formato /Order/{id}/details
        return this.http.get<any>(`${this.apiUrl}/${orderId}/details`).pipe(
          tap(details => console.log('Order details response from second URL:', details)),
          catchError(error2 => {
            console.warn(`Error with second URL format, trying third: ${error2.message}`);
            
            // Tercera opción: intentar con URL en formato /Order/{id}
            return this.http.get<any>(`${this.apiUrl}/${orderId}`).pipe(
              tap(details => console.log('Order details response from third URL:', details)),
              catchError(error3 => {
                console.error(`All URL formats failed for order ${orderId}:`, 
                              error1.message, error2.message, error3.message);
                
                // En caso de error en todas las opciones, devolver datos mock para esa orden
                const mockOrder = this.mockOrders.find(o => o.orderId === orderId);
                if (mockOrder && mockOrder.orderDetails) {
                  console.log(`Providing mock details for order ${orderId}`);
                  return of({
                    orderId: mockOrder.orderId,
                    customerName: mockOrder.shipName,
                    orderDate: mockOrder.orderDate,
                    requiredDate: mockOrder.requiredDate,
                    shippedDate: mockOrder.shippedDate,
                    shipAddress: mockOrder.shipAddress,
                    shipCity: mockOrder.shipCity,
                    shipCountry: mockOrder.shipCountry,
                    details: mockOrder.orderDetails
                  }).pipe(delay(300));
                }
                
                return of({
                  orderId: orderId,
                  customerName: 'Cliente No Encontrado',
                  orderDate: new Date().toISOString(),
                  details: []
                }).pipe(delay(300));
              })
            );
          })
        );
      })
    );
  }

  createOrder(order: any): Observable<Order> {
    console.log('Servicio - creando orden:', order);
    return this.http.post<Order>(this.apiUrl, order).pipe(
      tap(newOrder => {
        console.log('Respuesta del servidor:', newOrder);
        this.orders.update(orders => [...orders, newOrder]);
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        
        // Generar un ID único para la orden de prueba
        const newId = Math.max(...this.mockOrders.map(o => o.orderId), 0) + 1;
        const newMockOrder: Order = {
          orderId: newId,
          custId: order.custId || 0, // Asegurar que nunca sea undefined
          empId: order.empId || 1,
          orderDate: new Date().toISOString(),
          requiredDate: order.requiredDate,
          shippedDate: undefined, // Usar undefined en lugar de null
          shipperId: order.shipperId || 1,
          freight: order.freight || 0,
          shipName: order.shipName,
          shipAddress: order.shipAddress,
          shipCity: order.shipCity,
          shipRegion: order.shipRegion || '',
          shipPostalCode: order.shipPostalCode || '',
          shipCountry: order.shipCountry,
          status: 'Pending',
          // Convertir los detalles al formato que espera la UI (con quantity en lugar de qty)
          orderDetails: (order.orderDetails || []).map((detail: any) => ({
            orderDetailId: detail.orderDetailId || 0,
            orderId: detail.orderId || newId,
            productId: detail.productId,
            unitPrice: detail.unitPrice,
            quantity: detail.qty, // Convertir qty a quantity para la UI
            discount: detail.discount,
            product: {
              productId: detail.productId,
              productName: this.products.find(p => p.id === detail.productId)?.name || 'Producto'
            }
          }))
        };
        
        // Agregar a los datos de prueba
        this.mockOrders.push(newMockOrder);
        this.orders.update(orders => [...orders, newMockOrder]);
        
        return of(newMockOrder).pipe(delay(300));
      })
    );
  }
}
