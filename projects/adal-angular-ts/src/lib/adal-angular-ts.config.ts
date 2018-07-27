import { Injectable } from '@angular/core';
@Injectable()
export class AdalAngularTSConfig {
    public clientId: string;
    public tenant: string;
    public redirectUri: string;
    public postLogoutRedirectUrl?: string;
    public instance?: string;
    public extraQueryParameter?: string;
    public endpoints?; // Collection of {Endpoint-ResourceId}
    public anonymousEndpoints?: string[];
    public loginResource?: string;

    constructor(
    ) {
    }
}