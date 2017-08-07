
[![npm version](https://badge.fury.io/js/adal-angular-ts.svg)](https://badge.fury.io/js/adal-angular-ts)
![npm license](https://img.shields.io/npm/l/express.svg)

# adal-angular-ts
A typescript library that allows you to authenticate against Azure Active Directory and ADFS

## Instalation
```
npm i adal-angular-ts --save
```

## Example Usage

### Add Module to Bootstrap of Application
```
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AdalModule } from "adal-angular-ts";

const adalConfig = {
  clientId: "Your client id",
  tenant: "Your tenant", //google.onmicrosoft.com
  redirectUri: window.location.origin + '/',
  postLogoutRedirectUrl: null,
  instance: "https://login.microsoftonline.com/", // or adfs
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AdalModule.forRoot(adalConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Call Login in desired component
```
import { Component } from '@angular/core';
import { AdalProvider } from "adal-angular-ts";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  constructor(
    private adalConfig: AdalProvider
  ){
    this.adalConfig.login();
  }
}
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. 

## Contributing

Pull requests are welcome!
