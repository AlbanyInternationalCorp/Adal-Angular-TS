import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpInterceptor } from "@angular/common/http";
import { HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import 'rxjs/add/operator/mergeMap';
import { AdalProvider } from './adal.provider';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private auth: AdalProvider) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    return this.auth.getToken().mergeMap((token) => {
      if (token) {
          // clone and modify the request
          request = request.clone({
              setHeaders: {
                  Authorization: `Bearer ${token}`
              }
          });
      }
      
      return next.handle(request);
    });
  }
}
