import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { AuthenticationContext } from './adal-angular-ts';

@Injectable({
  providedIn: 'root'
})
export class AdalAngularTSService {

  constructor(private context: AuthenticationContext) {}

  login(): any {
    if(this.context.isCallback(window.location.hash)){
      this.context.handleWindowCallback(window.location.hash);
    }
    else {
      let error = this.context.getLoginError();
      if(error && error.error){ return error; }
      else{
        this.context.login();
      }
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

  clearCacheForResource(resource: string = null) {
    this.context.clearCacheForResource(resource);
  }

  private getResourceForEndpoint(endpoint: string) : string{
    return this.context.getResourceForEndpoint(endpoint);
  }

  getUserEmail() {
    return this.context.getUserEmail();
  }
}
