import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const HttpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = '';
      
      // Verificar si el error tiene un mensaje específico
      if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        // Client-side error con mensaje específico
        errorMsg = `Error: ${error.error.message}`;
      } else {
        // Error genérico
        errorMsg = `Error Code: ${error.status}, Message: ${error.message}`;
      }
      
      console.error(errorMsg);
      return throwError(() => new Error(errorMsg));
    })
  );
};
