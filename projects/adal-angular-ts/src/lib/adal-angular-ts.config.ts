import { Injectable } from '@angular/core';
@Injectable()
export class AdalAngularTSConfig {
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