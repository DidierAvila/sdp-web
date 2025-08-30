import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap, delay } from 'rxjs';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'https://localhost:7085/Customer';
  private customers = signal<Customer[]>([]);
  
  // Datos de muestra para usar cuando el backend no está disponible
  private mockCustomers: Customer[] = [
    { 
      custId: 1, 
      companyName: 'Alfreds Futterkiste', 
      contactName: 'Maria Anders', 
      contactTitle: 'Sales Representative',
      address: 'Obere Str. 57', 
      city: 'Berlin', 
      region: null, 
      postalCode: '12209', 
      country: 'Germany', 
      phone: '030-0074321', 
      fax: '030-0076545' 
    },
    { 
      custId: 2, 
      companyName: 'Ana Trujillo Emparedados y helados', 
      contactName: 'Ana Trujillo', 
      contactTitle: 'Owner',
      address: 'Avda. de la Constitución 2222', 
      city: 'México D.F.', 
      region: null, 
      postalCode: '05021', 
      country: 'Mexico', 
      phone: '(5) 555-4729', 
      fax: '(5) 555-3745' 
    },
    { 
      custId: 3, 
      companyName: 'Antonio Moreno Taquería', 
      contactName: 'Antonio Moreno', 
      contactTitle: 'Owner',
      address: 'Mataderos 2312', 
      city: 'México D.F.', 
      region: null, 
      postalCode: '05023', 
      country: 'Mexico', 
      phone: '(5) 555-3932', 
      fax: null 
    }
  ];

  constructor(private http: HttpClient) { }

  getCustomers(params: { 
    companyName?: string;
    contactName?: string; 
    country?: string;
    pageNumber?: number;
    pageSize?: number;
    orderBy?: string;
    searchTerm?: string;
  } = {}): Observable<PagedResult<Customer>> {
    // Build query parameters
    let queryParams = new URLSearchParams();
    if (params.companyName) queryParams.append('CompanyName', params.companyName);
    if (params.contactName) queryParams.append('ContactName', params.contactName);
    if (params.country) queryParams.append('Country', params.country);
    if (params.pageNumber) queryParams.append('PageNumber', params.pageNumber !== undefined ? params.pageNumber.toString() : '1');
    if (params.pageSize) queryParams.append('PageSize', params.pageSize !== undefined ? params.pageSize.toString() : '10');
    if (params.orderBy) queryParams.append('OrderBy', params.orderBy);
    if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);

    const url = `${this.apiUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log('Requesting:', url);
    
    // Make the HTTP request
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('API Raw Response:', response);
        
        // Check if the response is a PagedResult or just an array of customers
        if (Array.isArray(response)) {
          // If it's an array, wrap it in a PagedResult object
          const result: PagedResult<Customer> = {
            items: response,
            totalCount: response.length,
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || response.length,
            totalPages: 1
          };
          
          if (Object.keys(params).length === 0) {
            this.customers.set(response);
          }
          
          return result;
        } else if (response && response.items) {
          // If it's already a PagedResult
          if (Object.keys(params).length === 0) {
            this.customers.set(response.items);
          }
          
          return response as PagedResult<Customer>;
        } else {
          // If it's neither, create an empty PagedResult
          return {
            items: [],
            totalCount: 0,
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || 10,
            totalPages: 0
          };
        }
      }),
      catchError(error => {
        console.error('Error fetching customers:', error);
        
        // En caso de error, devolvemos datos mock para desarrollo
        console.log('Providing mock data for development');
        
        // Filtrar los datos mock según los parámetros
        let filteredMockData = [...this.mockCustomers];
          
        if (params.searchTerm) {
          const searchLower = params.searchTerm.toLowerCase();
          filteredMockData = filteredMockData.filter(c => 
            c.companyName?.toLowerCase().includes(searchLower) || 
            c.contactName?.toLowerCase().includes(searchLower) || 
            c.country?.toLowerCase().includes(searchLower)
          );
        }
        
        // Ordenar si es necesario
        if (params.orderBy) {
          const [field, direction] = params.orderBy.split(' ');
          filteredMockData.sort((a: any, b: any) => {
            if (!a[field]) return direction === 'asc' ? 1 : -1;
            if (!b[field]) return direction === 'asc' ? -1 : 1;
            return direction === 'asc' 
              ? a[field].localeCompare(b[field]) 
              : b[field].localeCompare(a[field]);
          });
        }
        
        // Paginar los resultados
        const pageNumber = params.pageNumber || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (pageNumber - 1) * pageSize;
        const paginatedData = filteredMockData.slice(startIndex, startIndex + pageSize);
        
        // Crear el resultado paginado
        const mockResult: PagedResult<Customer> = {
          items: paginatedData,
          totalCount: filteredMockData.length,
          pageNumber: pageNumber,
          pageSize: pageSize,
          totalPages: Math.ceil(filteredMockData.length / pageSize)
        };
        
        // Actualizar el estado local
        if (Object.keys(params).length === 0) {
          this.customers.set(paginatedData);
        }
        
        // Simular un retraso de red para que la UI muestre el spinner
        return of(mockResult).pipe(delay(300));
      })
    );
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching customer with ID ${id}:`, error);
        
        // Buscar en los datos de prueba
        const mockCustomer = this.mockCustomers.find(c => c.custId === id);
        
        if (mockCustomer) {
          return of(mockCustomer).pipe(delay(300));
        }
        
        throw error;
      })
    );
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer).pipe(
      tap(newCustomer => {
        this.customers.update(customers => [...customers, newCustomer]);
      }),
      catchError(error => {
        console.error('Error creating customer:', error);
        
        // Generar un ID único para el cliente de prueba
        const newId = Math.max(...this.mockCustomers.map(c => c.custId), 0) + 1;
        const newMockCustomer = { ...customer, custId: newId };
        
        // Agregar a los datos de prueba
        this.mockCustomers.push(newMockCustomer);
        this.customers.update(customers => [...customers, newMockCustomer]);
        
        return of(newMockCustomer).pipe(delay(300));
      })
    );
  }

  updateCustomer(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${customer.custId}`, customer).pipe(
      tap(updatedCustomer => {
        this.customers.update(customers => 
          customers.map(c => c.custId === updatedCustomer.custId ? updatedCustomer : c)
        );
      }),
      catchError(error => {
        console.error(`Error updating customer with ID ${customer.custId}:`, error);
        
        // Actualizar en los datos de prueba
        const index = this.mockCustomers.findIndex(c => c.custId === customer.custId);
        
        if (index !== -1) {
          this.mockCustomers[index] = customer;
          this.customers.update(customers => 
            customers.map(c => c.custId === customer.custId ? customer : c)
          );
          
          return of(customer).pipe(delay(300));
        }
        
        throw error;
      })
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.customers.update(customers => customers.filter(c => c.custId !== id));
      }),
      catchError(error => {
        console.error(`Error deleting customer with ID ${id}:`, error);
        
        // Eliminar de los datos de prueba
        const index = this.mockCustomers.findIndex(c => c.custId === id);
        
        if (index !== -1) {
          this.mockCustomers.splice(index, 1);
          this.customers.update(customers => customers.filter(c => c.custId !== id));
          
          return of(undefined).pipe(delay(300));
        }
        
        throw error;
      })
    );
  }
}
