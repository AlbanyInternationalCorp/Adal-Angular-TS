import { AdalConfig } from './adal.config';
import { AuthenticationContext } from './adal';
/// <reference path="./index.d.ts" />
import { Injectable, Inject } from '@angular/core';

@Injectable()
export class AdalProvider {
    constructor(
        @Inject('config') private adalConfig: any
    ) {
    }
    login() {
        //take values and set prop and then login make optional?
        let x = new AuthenticationContext(this.adalConfig.tenant, this.adalConfig.clientId, this.adalConfig.redirectUri, this.adalConfig.instance);
        if (!x.isCallback(window.location.hash)) {
            x.login();
        } else {
            var parameters = x.deserialize(window.location.hash);
            // loop through params and save
            Object.keys(parameters).forEach(function (currentKey) {
                x.saveItem(currentKey, parameters[currentKey]);
            });
            //strip hash from url
            window.location.hash = '';
        }
    }

    getToken() {
        let token = window.sessionStorage.getItem('#id_token');
        return token;
    }
} 