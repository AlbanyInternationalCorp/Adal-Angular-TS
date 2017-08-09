import { AdalProvider } from './adal.provider';
/// <reference path="./index.d.ts" />
import { Injectable, HttpInterceptor, HttpRequest, HttpHandler, Observable } from '@angular/core';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private auth: AdalProvider) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    const authrequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`
      }
    });
    return next.handle(authrequest);
  }
}
