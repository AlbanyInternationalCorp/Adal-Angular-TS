import { AdalConfig } from './adal.config';
import { AuthenticationContext } from './adal';
/// <reference path="./index.d.ts" />
import { Injectable, Inject } from '@angular/core';

@Injectable()
export class AdalProvider {
    constructor(
        @Inject('config') private adalConfig: any,
        private context: AuthenticationContext
    ) {
        this.context.initialize(this.adalConfig.tenant, this.adalConfig.clientId, this.adalConfig.redirectUri, this.adalConfig.instance);
    }
    login() {
        if (!this.context.isCallback(window.location.hash)) {
            this.context.login();
        } else {
            let hash = window.location.hash.substr(1);
            var parameters = this.context.deserialize(hash);
            // loop through params and save
            for (let key in parameters) {
                let value = parameters[key];
                this.context.saveItem(key, parameters[key]);
                // Use `key` and `value`
            }
            var tokenParams = JSON.parse(atob(window.sessionStorage.getItem('id_token').split('.')[1]));
            for (let key in tokenParams) {
                let value = tokenParams[key];
                this.context.saveItem(key, tokenParams[key]);
                // Use `key` and `value`
            }
            //strip hash from url
            window.location.hash = '';
        }
    }


    getToken() {
        return this.context.getCachedToken();
    }
} 