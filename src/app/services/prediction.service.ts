import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, delay, map } from 'rxjs';
import { Order } from '../models/order.model';
import { PagedResult } from '../models/paged-result.model';

export interface SalesPrediction {
  customerId: number;
  customerName: string;
  lastOrderDate: string;
  nextPredictedOrder: string;
  averageDaysBetweenOrders: number; // Información adicional útil
}

export interface SalesPredictionParams {
  customerName?: string;
  pageNumber?: number;
  pageSize?: number;
  orderBy?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = 'https://localhost:7085';
  
  constructor(private http: HttpClient) { }
  
  getSalesPredictions(params: SalesPredictionParams = {}): Observable<PagedResult<SalesPrediction>> {
    // Configurar parámetros para la API basados en el contrato
    let httpParams = new HttpParams();
    
    if (params.customerName) {
      httpParams = httpParams.set('CustomerName', params.customerName);
    }
    
    if (params.pageNumber !== undefined) {
      httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    }
    
    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('PageSize', params.pageSize.toString());
    }
    
    if (params.orderBy) {
      httpParams = httpParams.set('OrderBy', params.orderBy);
    }
    
    if (params.searchTerm) {
      httpParams = httpParams.set('SearchTerm', params.searchTerm);
    }
    
    // Intentar obtener datos de la API
    return this.http.get<any>(`${this.apiUrl}/Customer/sales-prediction`, { params: httpParams }).pipe(
      map(response => {
        console.log('Respuesta original del API:', response);
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          console.log('La respuesta es un array directo');
          // La API devuelve un array directamente
          const result: PagedResult<SalesPrediction> = {
            items: response,
            totalCount: response.length,
            pageNumber: params.pageNumber || 1,
            pageSize: params.pageSize || response.length,
            totalPages: 1
          };
          return result;
        } else if (response && typeof response === 'object') {
          console.log('La respuesta es un objeto');
          
          // Verificar si la respuesta ya tiene la estructura PagedResult
          if (response.items !== undefined && response.totalCount !== undefined) {
            console.log('La respuesta ya tiene formato PagedResult');
            return response as PagedResult<SalesPrediction>;
          }
          
          // Buscar propiedades que puedan contener los datos
          const possibleArrayProps = Object.keys(response).find(key => 
            Array.isArray(response[key])
          );
          
          if (possibleArrayProps) {
            console.log(`Encontrada propiedad de array: ${possibleArrayProps}`);
            const items = response[possibleArrayProps];
            const result: PagedResult<SalesPrediction> = {
              items: items,
              totalCount: items.length,
              pageNumber: params.pageNumber || 1,
              pageSize: params.pageSize || items.length,
              totalPages: 1
            };
            return result;
          }
          
          // Si no hay arrays, intentar usar todo el objeto como un solo item
          console.log('Intentando usar todo el objeto como un solo item');
          const result: PagedResult<SalesPrediction> = {
            items: [response as SalesPrediction],
            totalCount: 1,
            pageNumber: 1,
            pageSize: 1,
            totalPages: 1
          };
          return result;
        } else {
          console.warn('Formato de respuesta no reconocido, devolviendo resultado vacío');
          // No se pudo interpretar la respuesta
          return {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0
          } as PagedResult<SalesPrediction>;
        }
      }),
      catchError(error => {
        console.error('Error fetching sales predictions:', error);
        
        // Generar datos de muestra en caso de error
        const mockData = this.generateMockPredictions();
        const mockResult: PagedResult<SalesPrediction> = {
          items: mockData,
          totalCount: mockData.length,
          pageNumber: params.pageNumber || 1,
          pageSize: params.pageSize || 10,
          totalPages: Math.ceil(mockData.length / (params.pageSize || 10))
        };
        
        return of(mockResult).pipe(delay(500));
      })
    );
  }
  
  // Datos de muestra para visualizar la funcionalidad
  private generateMockPredictions(): SalesPrediction[] {
    // Lista de clientes de ejemplo
    const customers = [
      { id: 1, name: 'Alfreds Futterkiste' },
      { id: 2, name: 'Ana Trujillo Emparedados y helados' },
      { id: 3, name: 'Antonio Moreno Taquería' },
      { id: 4, name: 'Around the Horn' },
      { id: 5, name: 'Berglunds snabbköp' }
    ];
    
    const today = new Date();
    const predictions: SalesPrediction[] = [];
    
    customers.forEach(customer => {
      // Generar una fecha de última orden aleatoria entre 10 y 30 días atrás
      const daysAgo = Math.floor(Math.random() * 20) + 10;
      const lastOrderDate = new Date(today);
      lastOrderDate.setDate(lastOrderDate.getDate() - daysAgo);
      
      // Generar un promedio aleatorio de días entre 15 y 45
      const averageDays = Math.floor(Math.random() * 30) + 15;
      
      // Calcular la fecha de la próxima orden prevista
      const nextOrderDate = new Date(lastOrderDate);
      nextOrderDate.setDate(lastOrderDate.getDate() + averageDays);
      
      predictions.push({
        customerId: customer.id,
        customerName: customer.name,
        lastOrderDate: lastOrderDate.toISOString(),
        nextPredictedOrder: nextOrderDate.toISOString(),
        averageDaysBetweenOrders: averageDays
      });
    });
    
    return predictions;
  }
}
