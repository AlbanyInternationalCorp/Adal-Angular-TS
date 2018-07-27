import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { AuthenticationContext } from './adal-angular-ts';

@Injectable({
  providedIn: 'root'
})
export class AdalAngularTSService {

  constructor(private context: AuthenticationContext) {}

  login() {
    if (!this.context.isCallback(window.location.hash)) {
      this.context.login();
    } else {
      this.context.handleWindowCallback(window.location.hash);
    }
  }

  getCachedToken(resource: string = null): string {
    return this.context.getCachedToken(resource);
  }

  getToken(resource?: string, endpoint?: string): Observable<string> {
    let self = this;
    if(!resource){
      resource = this.getResourceForEndpoint(endpoint);
    }
    return Observable.create(function(observer: any) {
      self.context.acquireToken(resource, function cb(
        description: any,
        token: any
      ) {
        observer.next(token);
        observer.complete();
      });
    });
  }

  private getResourceForEndpoint(endpoint: string) : string{
    return this.context.getResourceForEndpoint(endpoint);
  }

  getUserEmail() {
    return this.context.getUserEmail();
  }
}
