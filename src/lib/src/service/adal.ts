import { AdalConfig } from './../../../../out-tsc/lib/src/service/adal.config';
import { Injectable, Inject } from '@angular/core';
@Injectable()
export class AuthenticationContext {

    constructor(
        @Inject('config') private config: AdalConfig
    ) {
        if (!this.config.instance) this.config.instance = "https://login.microsoftonline.com/";
    }

    handleCallback() {
        let hash = this.getHash(window.location.hash);
        var parameters = this.deserialize(hash);
        // loop through params and save
        for (let key in parameters) {
            let value = parameters[key];
            this.saveItem(key, parameters[key]);
            // Use `key` and `value`
        }
        var tokenParams = JSON.parse(atob(this.getItem('id_token').split('.')[1]));
        for (let key in tokenParams) {
            let value = tokenParams[key];
            this.saveItem(key, tokenParams[key]);
            // Use `key` and `value`
        }
        //strip hash from url
        window.location.hash = '';
    }

    private getUrl(responseType = 'id_token', resource: any = null): string {
        let tenant = this.config.tenant ? this.config.tenant : 'common';
        let url = this.config.instance + tenant + '/oauth2/authorize' + this.serialize(responseType, resource) + this.addLibMetadata();
        return url;
    }

    private addLibMetadata() {
        // x-client-SKU
        // x-client-Ver
        return '&x-client-SKU=Js&x-client-Ver=' + this.libVersion();
    }

    private libVersion() {
        return '1.0.15';
    }

    url: string;


    private saveItem(key: string, object: any): boolean {
        //TODO: scrap local keep session
        // check if session storage is supported if so save there
        if (this.supportSessionStorage()) {
            sessionStorage.setItem(key, object);
            return true;
        } else {
            return false;
        }
    }

    acquireToken(): any {
        let token = this.getItem('id_token');
        let expiry = parseInt(this.getItem('exp'));

        // If expiration is within offset, it will force renew
        // var offset = 300;
        // if (expiry && (expiry > Date.now())) {
        //     console.log("22");
        //     return token;
        // } else {
        //     // this.saveItem('id_token', '');
        //     // this.saveItem('exp', 0);
        //     return token;
        // }
        return token;
    }

    private getItem(key: string): string {
        return window.sessionStorage.getItem(key);
    }

    private supportSessionStorage() {
        try {
            if (!window.sessionStorage) return false; // Test availability
            window.sessionStorage.setItem('storageTest', 'A'); // Try write
            if (window.sessionStorage.getItem('storageTest') != 'A') return false; // Test read/write
            window.sessionStorage.removeItem('storageTest'); // Try delete
            if (window.sessionStorage.getItem('storageTest')) return false; // Test delete
            return true; // Success
        } catch (error) {
            return false;
        }
    }

    private decimalToHex(value: number) {
        var hex = value.toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }



    private getGUID() {
        var cryptoObj = window.crypto //|| window.msCrypto; // for IE 11
        if (cryptoObj && cryptoObj.getRandomValues) {
            var buffer = new Uint8Array(16);
            cryptoObj.getRandomValues(buffer);
            //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".
            //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.
            return this.decimalToHex(buffer[0]) + this.decimalToHex(buffer[1]) + this.decimalToHex(buffer[2]) + this.decimalToHex(buffer[3]) + '-' + this.decimalToHex(buffer[4]) + this.decimalToHex(buffer[5]) + '-' + this.decimalToHex(buffer[6]) + this.decimalToHex(buffer[7]) + '-' +
                this.decimalToHex(buffer[8]) + this.decimalToHex(buffer[9]) + '-' + this.decimalToHex(buffer[10]) + this.decimalToHex(buffer[11]) + this.decimalToHex(buffer[12]) + this.decimalToHex(buffer[13]) + this.decimalToHex(buffer[14]) + this.decimalToHex(buffer[15]);
        } else {
            var guidHolder = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
            var hex = '0123456789abcdef';
            var r = 0;
            var guidResponse = "";
            for (var i = 0; i < 36; i++) {
                if (guidHolder[i] !== '-' && guidHolder[i] !== '4') {
                    // each x and y needs to be random
                    r = Math.random() * 16 | 0;
                }
                if (guidHolder[i] === 'x') {
                    guidResponse += hex[r];
                } else if (guidHolder[i] === 'y') {
                    // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                    r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                    r |= 0x8; // set pos 3 to 1 as 1???
                    guidResponse += hex[r];
                } else {
                    guidResponse += guidHolder[i];
                }
            }
            return guidResponse;
        }
    }
    login() {
        let expectedState = this.getGUID();
        //        this.config.state = expectedState;
        let idTokenNonce = this.getGUID();
        this.saveItem('adal.login.request', window.location.href);
        this.saveItem('adal.login.error', '');
        this.saveItem('adal.state.login', expectedState);
        this.saveItem('adal.nonce.idtoken', idTokenNonce);
        this.saveItem('adal.error', '');
        this.saveItem('error_description', '');
        this.url = this.getUrl('id_token', null) + '&nonce=' + encodeURIComponent(idTokenNonce);
        this.promptUser(this.url);
    }

    private promptUser(url: string) {
        if (url) window.location.replace(url);
        else console.error("URL not provided");

    }

    private serialize(responseType: any, resource: any) {
        var str = [];
        str.push('?response_type=' + responseType);
        str.push('client_id=' + encodeURIComponent(this.config.clientId));
        if (resource) {
            str.push('resource=' + encodeURIComponent(resource));
        }

        str.push('redirect_uri=' + encodeURIComponent(this.config.redirectUri));
        str.push('state=' + encodeURIComponent(''));

        var correlationId = this.getGUID();
        str.push('client-request-id=' + encodeURIComponent(correlationId));

        return str.join('&');
    }

    isCallback(hash: any) {
        hash = this.getHash(hash);
        var parameters = this.deserialize(hash);
        return (
            parameters.hasOwnProperty('error_description') ||
            parameters.hasOwnProperty('access_token') ||
            parameters.hasOwnProperty('id_token')
        );
    }

    private getHash(hash: any) {
        if (hash.indexOf('#/') > -1) {
            hash = hash.substring(hash.indexOf('#/') + 2);
        } else if (hash.indexOf('#') > -1) {
            hash = hash.substring(1);
        }
        return hash;
    }

    private deserialize(hash: any) {
        var match,
            pl = /\+/g, // Regex for replacing addition symbol with a space
            search = /([^&=]+)=([^&]*)/g,
            decode = function (s: any) {
                return decodeURIComponent(s.replace(pl, ' '));
            },
            obj = {};
        match = search.exec(hash);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(hash);
        }

        return obj;

    }

}

