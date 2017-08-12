import { AdalConfig } from './adal.config';
import { AuthenticationContext } from './adal';
/// <reference path="./index.d.ts" />
import { Injectable, Inject } from '@angular/core';

@Injectable()
export class AdalProvider {
    constructor(
        private context: AuthenticationContext
    ) {
    }
    login() {
        //take values and set prop and then login make optional?
        if (!this.context.isCallback(window.location.hash)) {
            this.context.login();
        } else {
            this.context.handleCallback();
        }
    }

    getToken() {
        return this.context.acquireToken();
    }
} 