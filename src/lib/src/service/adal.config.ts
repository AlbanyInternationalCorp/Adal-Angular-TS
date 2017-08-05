export class AdalConfig {
    public resource: string;
    constructor(public clientId: string,
        public tenant: string,
        public redirectUri: string,
        public postLogoutRedirectUrl?: string,
        public instance?: string,
        public extraQueryParameter?: string) {
    };
}