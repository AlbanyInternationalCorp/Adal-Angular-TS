export class AuthenticationContext {
    constructor(
        private tenant: string,
        private clientID: string,
        private redirectUri: string,
        private instance?: string,
        private endpoints?: any[],
        private popUp?: boolean,
        private localLoginUrl?: string,
        private displayCall?: any,
        private postLogoutRedirectUri?: string,
        private cacheLocation?: string,
        private anonymousEndpoints?: any[],
        private expireOffsetSeconds?: number,
        private correlationId?: string,
    ) {
        this.instance = this.instance ? this.instance : 'https://login.microsoftonline.com/';
        this.url = `
        ${this.instance}${this.tenant}/oauth2/authorize?response_type=id_token&client_id=${this.clientID}&redirect_uri=${this.redirectUri}&state=b0a0540f-13ff-4547-88ed-389401fa5bdc&&client-request-id=efcaea8a-6a4a-45fb-aea3-4fa421c449fc&x-client-SKU=Js&x-client-Ver=1.0.14&nonce=644acc7d-978d-491d-99e9-13c42dc2f5a5`;
    }
    url: string;
    private config = {
        state: '',
        tenant: '',
        displayCall: function (display: string) {
        },
    }
    CONSTANTS = {
        ACCESS_TOKEN: 'access_token',
        EXPIRES_IN: 'expires_in',
        ID_TOKEN: 'id_token',
        ERROR_DESCRIPTION: 'error_description',
        SESSION_STATE: 'session_state',
        STORAGE: {
            TOKEN_KEYS: 'adal.token.keys',
            ACCESS_TOKEN_KEY: 'adal.access.token.key',
            EXPIRATION_KEY: 'adal.expiration.key',
            STATE_LOGIN: 'adal.state.login',
            STATE_RENEW: 'adal.state.renew',
            NONCE_IDTOKEN: 'adal.nonce.idtoken',
            SESSION_STATE: 'adal.session.state',
            USERNAME: 'adal.username',
            IDTOKEN: 'adal.idtoken',
            ERROR: 'adal.error',
            ERROR_DESCRIPTION: 'adal.error.description',
            LOGIN_REQUEST: 'adal.login.request',
            LOGIN_ERROR: 'adal.login.error',
            RENEW_STATUS: 'ad?al.token.renew.status'
        },
        RESOURCE_DELIMETER: '|',
        LOADFRAME_TIMEOUT: '6000',
        TOKEN_RENEW_STATUS_CANCELED: 'Canceled',
        TOKEN_RENEW_STATUS_COMPLETED: 'Completed',
        TOKEN_RENEW_STATUS_IN_PROGRESS: 'In Progress',
        LOGGING_LEVEL: {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            VERBOSE: 3
        },
        LEVEL_STRING_MAP: {
            0: 'ERROR:',
            1: 'WARNING:',
            2: 'INFO:',
            3: 'VERBOSE:'
        },
        POPUP_WIDTH: 483,
        POPUP_HEIGHT: 600
    };


    //??
    _loginInProgress = false;

    saveItem(key: string, object: string) {
        //check if should be saved to local storage?
        if (this.cacheLocation === 'localStorage') {
            //check if local storage is supported
            if (!this.supportLocalStorage()) {
                return false;
            }

            //save to local storage
            localStorage.setItem(key, object);
        }
        if (!this.supportSessionStorage()) {
            return false;
        }
        sessionStorage.setItem(key, object);
        return true;
    }

    supportSessionStorage() {
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

    supportLocalStorage(): boolean {
        try {
            if (!window.localStorage) return false; //test availability
            window.localStorage.setItem('storageTest', 'A'); // try write
            if (window.localStorage.getItem('storageTest') != 'A') return false; //test read write
            window.localStorage.removeItem('storageTest'); // try delete
            if (window.localStorage.getItem('storageTest')) return false; //test delete
        } catch (error) {
            return false;
        }
    }

    decimalToHex(value: number) {
        var hex = value.toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }



    getGUID() {
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
        this.config.state = expectedState;
        let idTokenNonce = this.getGUID();
        this.saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, window.location.href);
        this.saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, '');
        this.saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, expectedState);
        this.saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, idTokenNonce);
        this.saveItem(this.CONSTANTS.STORAGE.ERROR, '');
        this.saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, '');
        this.promptUser(this.url);
    }

    promptUser(url: string) {
        if (url) {
            window.location.replace(url);
        } else {
        }
    }
    
    serialize(responseType: any, obj: any, resource: any) {
        var str = [];
        if (obj !== null) {
            str.push('?response_type=' + responseType);
            str.push('client_id=' + encodeURIComponent(this.clientID));
            if (resource) {
                str.push('resource=' + encodeURIComponent(resource));
            }

            str.push('redirect_uri=' + encodeURIComponent(this.redirectUri));
            str.push('state=' + encodeURIComponent(obj.state));

            if (obj.hasOwnProperty('slice')) {
                str.push('slice=' + encodeURIComponent(obj.slice));
            }

            if (obj.hasOwnProperty('extraQueryParameter')) {
                str.push(obj.extraQueryParameter);
            }

            var correlationId = obj.correlationId ? obj.correlationId : this.getGUID();
            str.push('client-request-id=' + encodeURIComponent(correlationId));
        }

        return str.join('&');
    }

    isCallback(hash: any) {
        hash = this.getHash(hash);
        console.log(hash)
        var parameters = this.deserialize(hash);
        return (
            parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
            parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)
        );
    }

    getHash(hash: any) {
        if (hash.indexOf('#/') > -1) {
            hash = hash.substring(hash.indexOf('#/') + 2);
        } else if (hash.indexOf('#') > -1) {
            hash = hash.substring(1);
        }
        return hash;
    }

    deserialize(hash: any) {
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

