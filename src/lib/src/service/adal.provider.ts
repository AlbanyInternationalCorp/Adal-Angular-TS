import { AdalConfig } from './adal.config';
import { AuthenticationContext } from './adal';
/// <reference path="./index.d.ts" />
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AdalProvider {
    constructor(
        private context: AuthenticationContext
    ) {
    }

    login() {
        if (!this.context.isCallback(window.location.hash)) {
            this.context.login();
        } else {
            this.context.handleWindowCallback(window.location.hash);
        }
    }

    getToken(): Observable<string> {
        let self = this;
        return Observable.create(function(observer){
            self.context.acquireToken(null, function cb(token){
                observer.next(token);
                observer.complete();
            });
        });
    }
} 