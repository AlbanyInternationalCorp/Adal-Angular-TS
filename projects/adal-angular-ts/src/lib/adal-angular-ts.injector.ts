import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor } from "@angular/common/http";
import { HttpRequest, HttpHandler, HttpEvent, HttpResponse } from "@angular/common/http";
import { mergeMap } from 'rxjs/operators'

import { AdalAngularTSService } from './adal-angular-ts.service';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {

    constructor(private auth: AdalAngularTSService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        var resource = this.auth.getResourceForEndpoint(request.urlWithParams);
        return this.auth.getToken(resource).pipe(mergeMap((token) => {
            if (token) {
                // clone and modify the request
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            return next.handle(request);
        }));
    }
}
