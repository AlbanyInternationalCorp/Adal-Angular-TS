<!--TODO: Add how to use interceptor -->
[![npm version](https://badge.fury.io/js/adal-angular-ts.svg)](https://badge.fury.io/js/adal-angular-ts)
![npm license](https://img.shields.io/npm/l/express.svg)

# adal-angular-ts
A typescript library that allows you to authenticate against Azure Active Directory. 

Version 6.0.0 supports Angular 6.0.0. For Support for Angular `2.0.0 > & < 6.0.0` run `npm i adal-angular-ts@1.1.6`.

This library was built using [Angular CLI](https://github.com/angular/angular-cli/wiki/stories-create-library).

## Instalation
```
npm i adal-angular-ts
```

## Example Usage

### Add Module to Bootstrap of Application
```
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AdalAngularTSModule, TokenInterceptor } from "adal-angular-ts";

const adalConfig = {
  clientId: '11111111-1111-1111-1111-11111111111',
  tenant: 'companyName.onmicrosoft.com',
  redirectUri: null,
  postLogoutRedirectUrl: window.location.origin,
  instance: 'https://login.microsoftonline.com/',
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AdalAngularTSModule.forRoot(adalConfig)
  ],
  providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true,
        }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Call Login in desired component
```
import { Component } from '@angular/core';
import { AdalAngularTSService } from "adal-angular-ts";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  constructor(
    private adalService: AdalAngularTSService
  ){
    this.adalService.login();
  }
}
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. 

## Contributing

Pull requests are welcome!
