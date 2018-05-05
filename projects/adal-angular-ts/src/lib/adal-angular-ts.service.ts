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

  getToken(): Observable<string> {
    let self = this;
    return Observable.create(function(observer: any) {
      self.context.acquireToken(null, function cb(
        description: any,
        token: any
      ) {
        observer.next(token);
        observer.complete();
      });
    });
  }

  getUserEmail() {
    return this.context.getUserEmail();
  }
}
