import { Injectable } from '@angular/core';
@Injectable()
export class AdalConfig {
    public clientId: string;
    public tenant: string;
    public redirectUri: string;
    public postLogoutRedirectUrl?: string;
    public instance?: string;
    public extraQueryParameter?: string;
    constructor(

    ) {
    }
}