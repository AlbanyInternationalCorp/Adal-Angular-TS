import { AdalConfig } from './adal.config';
import { AuthenticationContext } from './adal';
/// <reference path="./index.d.ts" />
import { Injectable } from '@angular/core';

@Injectable()
export class AdalProvider {
  tenant: string;
  clientID: string;
  redirectUri: string;
  instance: string;
  constructor(
  ) {
  }
  //handle the auth redirect and stuff here

  login(context: AdalConfig) {
    //take values and set prop and then login make optional?
    let x = new AuthenticationContext(context.tenant, context.clientId, context.redirectUri, context.instance);
    if (!x.isCallback(window.location.hash)) {
      console.log("is not callback")
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

  getToken(){
    let token = window.sessionStorage.getItem('#id_token');
    return token;
  }
} 