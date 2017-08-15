import { AdalConfig } from './adal.config';
import { Injectable, Inject } from '@angular/core';
@Injectable()
export class AuthenticationContext {

    private url: string;
    private _activeRenewals: any = {};
    private _loginInProgress: boolean = false;
    private callback: any = null;
    private _user: any = {};
    private _idTokenNonce: string = null;

    constructor(
        @Inject('config') private config: AdalConfig
    ) {
        if (!this.config.instance) this.config.instance = "https://login.microsoftonline.com/";

        (<any>window).renewStates = [];
        (<any>window).callBackMappedToRenewStates = {};
        (<any>window).callBacksMappedToRenewStates = {};
    }

    /**
     * Initiates the login process by redirecting the user to Azure AD authorization endpoint.
     */
    login(/*loginStartPage*/) {
        // Token is not present and user needs to login
        if (this._loginInProgress) {
            //this.info("Login in progress");
            return;
        }
        var expectedState = this.getGUID();
        (<any>this.config).state = expectedState;
        this._idTokenNonce = this.getGUID();
        //this.verbose('Expected state: ' + expectedState + ' startPage:' + window.location.href);
        this.saveItem('adal.login.request', /*loginStartPage ||*/ window.location.href);
        this.saveItem('adal.login.error', '');
        this.saveItem('adal.state.login', expectedState);
        this.saveItem('adal.nonce.idtoken', this._idTokenNonce);
        this.saveItem('adal.error', '');
        this.saveItem('adal.error.description', '');
        var urlNavigate = this.getUrl('id_token', null) + '&nonce=' + encodeURIComponent(this._idTokenNonce);
        this._loginInProgress = true;
        // if (this.config.displayCall) {
        //     // User defined way of handling the navigation
        //     this.config.displayCall(urlNavigate);
        // }
        // else if (this.popUp) {
        //     this._loginPopup(urlNavigate);
        // }
        // else {
            this.promptUser(urlNavigate);
        //}
    }

    isCallback(hash: string): boolean {
        hash = this.getHash(hash);
        var parameters = this.deserialize(hash);
        return (
            parameters.hasOwnProperty('error_description') ||
            parameters.hasOwnProperty('access_token') ||
            parameters.hasOwnProperty('id_token')
        );
    }

    /**
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     */
    handleWindowCallback(hash: string) {
        // This is for regular javascript usage for redirect handling
        // need to make sure this is for callback
        if (hash == null)
            hash = window.location.hash;
        if (this.isCallback(hash)) {
            var requestInfo = this.getRequestInfo(hash);
            console.log(requestInfo);
            //this.info('Returned from redirect url');
            this.saveTokenFromHash(requestInfo);
            var token = null, callback = null;
            if ((requestInfo.requestType === 'RENEW_TOKEN') && window.parent) {
                // iframe call but same single page
                //this.verbose('Window is in iframe');
                callback = (<any>window.parent).callBackMappedToRenewStates[requestInfo.stateResponse];
                token = requestInfo.parameters['access_token'] || requestInfo.parameters['id_token'];
            } else if (requestInfo.requestType === 'LOGIN') {
                callback = this.callback;
                token = requestInfo.parameters['id_token'];
            }
            try {
                if (callback)
                    callback(this.getItem('adal.error.description'), token, this.getItem('adal.error'));
            } catch (err) {
                //this.error('Error occurred in user defined callback function', err)
            }
            if (true) { //!this.popUp) {
                window.location.hash = '';
                if ((<any>this.config).navigateToLoginRequestUrl)
                    window.location.href = this.getItem('adal.login.request');
            }
        }
    }
    
    /**
     * Acquires token from the cache if it is not expired. Otherwise sends request to AAD to obtain a new token.
     * @param {string}   resource  ResourceUri identifying the target resource
     * @param {tokenCallback} callback -  The callback provided by the caller. It will be called with token or error.
     */
    acquireToken(resource: string, callback: any) {
        
         // if (resource == null || resource == '') {
         //     observer.throw('Input value resource is required!');
         // }
 
         if(resource == null || resource == '') resource = this.config.clientId;
         var token = this.getCachedToken(resource);
         if (token) {
             callback(token);
             return;
         }
 
         if (!this._user) {
             //this.warn('User login is required');
             callback('User login is required', null, 'login required');
             return;
         }
 
         // refresh attept with iframe
         //Already renewing for this resource, callback when we get the token.
         if (this._activeRenewals[resource]) {
             //Active renewals contains the state for each renewal.
             this.registerCallback(this._activeRenewals[resource], resource, callback);
         }
         else {
             //if (resource === this.config.clientId) {
                 // App uses idtoken to send to api endpoints
                 // Default resource is tracked as clientid to store this token
                 this._renewIdToken(callback);
             // } else {
             //     this._renewToken(resource, callback);
             // }
         }
     }



    /**
    * Creates a requestInfo object from the URL fragment and returns it.
    * @returns {RequestInfo} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
    */
   private getRequestInfo(hash: string) {
       hash = this.getHash(hash);
       var parameters = this.deserialize(hash);
       var requestInfo = {
           valid: false,
           parameters: {},
           stateMatch: false,
           stateResponse: '',
           requestType: 'UNKNOWN'
       };
       if (parameters) {
           requestInfo.parameters = parameters;
           if (parameters.hasOwnProperty('error_description') ||
               parameters.hasOwnProperty('access_token') ||
               parameters.hasOwnProperty('id_token')) {

               requestInfo.valid = true;

               // which call
               var stateResponse = '';
               if (parameters.hasOwnProperty('state')) {
                   //this.verbose('State: ' + parameters.state);
                   stateResponse = (<any>parameters).state;
               } else {
                   //this.warn('No state returned');
                   return requestInfo;
               }

               requestInfo.stateResponse = stateResponse;

               // async calls can fire iframe and login request at the same time if developer does not use the API as expected
               // incoming callback needs to be looked up to find the request type
               if (stateResponse === this.getItem('adal.state.login')) {
                   requestInfo.requestType = 'LOGIN';
                   requestInfo.stateMatch = true;
                   return requestInfo;
               }

               else if (stateResponse === this.getItem('adal.state.renew')) {
                   requestInfo.requestType = 'RENEW_TOKEN';
                   requestInfo.stateMatch = true;
                   return requestInfo;
               }

               // external api requests may have many renewtoken requests for different resource
               if (!requestInfo.stateMatch && window.parent) {
                   var statesInParentContext = (<any>window.parent).renewStates;
                   for (var i = 0; i < statesInParentContext.length; i++) {
                       if (statesInParentContext[i] === requestInfo.stateResponse) {
                           requestInfo.requestType = 'RENEW_TOKEN';
                           requestInfo.stateMatch = true;
                           break;
                       }
                   }
               }
           }
       }

       return requestInfo;
   }

   /**
     * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
     */
    private saveTokenFromHash(requestInfo: any) {
        //this.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
        this.saveItem('adal.error', '');
        this.saveItem('adal.error.description', '');

        var resource = this._getResourceFromState(requestInfo.stateResponse);

        // Record error
        if (requestInfo.parameters.hasOwnProperty('error_description')) {
            //this.info('Error :' + requestInfo.parameters.error + '; Error description:' + requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);
            this.saveItem('adal.error', requestInfo.parameters.error);
            this.saveItem('adal.error.description', requestInfo.parameters['error_description']);

            if (requestInfo.requestType === 'LOGIN') {
                this._loginInProgress = false;
                this.saveItem('adal.login.error', requestInfo.parameters.error_description);
            }
        } else {
            // It must verify the state from redirect
            if (requestInfo.stateMatch) {
                // record tokens to storage if exists
                //this.info('State is right');
                if (requestInfo.parameters.hasOwnProperty('session_state')) {
                    this.saveItem('adal.session.state', requestInfo.parameters['session_state']);
                }

                var keys;

                if (requestInfo.parameters.hasOwnProperty('access_token')) {
                    //this.info('Fragment has access token');

                    if (!this._hasResource(resource)) {
                        keys = this.getItem('adal.token.keys') || '';
                        this.saveItem('adal.token.keys', keys + resource + '|');
                    }
                    // save token with related resource
                    this.saveItem('adal.access.token.key' + resource, requestInfo.parameters['access_token']);
                    this.saveItem('adal.expiration.key' + resource, this._expiresIn(requestInfo.parameters['expires_in']));
                }

                if (requestInfo.parameters.hasOwnProperty('id_token')) {
                    //this.info('Fragment has id token');
                    this._loginInProgress = false;

                    this._user = this._createUser(requestInfo.parameters['id_token']);

                    if (this._user && this._user.profile) {
                        if (this._user.profile.nonce !== this.getItem('adal.nonce.idtoken')) {
                            this._user = null;
                            this.saveItem('adal.login.error', 'Nonce is not same as ' + this._idTokenNonce);
                        } else {
                            this.saveItem('adal.idtoken', requestInfo.parameters['id_token']);

                            // Save idtoken as access token for app itself
                            resource = /*this.config.loginResource ? this.config.loginResource :*/ this.config.clientId;

                            if (!this._hasResource(resource)) {
                                keys = this.getItem('adal.token.keys') || '';
                                this.saveItem('adal.token.keys', keys + resource + '|');
                            }
                            this.saveItem('adal.access.token.key' + resource, requestInfo.parameters['id_token']);
                            this.saveItem('adal.expiration.key' + resource, this._user.profile.exp);
                        }
                    }
                    else {
                        this.saveItem('adal.error', 'invalid id_token');
                        this.saveItem('adal.error.description', 'Invalid id_token. id_token: ' + requestInfo.parameters['id_token']);
                    }
                }
            } else {
                this.saveItem('adal.error', 'Invalid_state');
                this.saveItem('adal.error.description', 'Invalid_state. state: ' + requestInfo.stateResponse);
            }
        }
        this.saveItem('adal.token.renew.status' + resource, 'Completed');
    }

    /**
     * Extracts resource value from state.
     * @ignore
     */
    private _getResourceFromState(state: string): string {
        if (state) {
            var splitIndex = state.indexOf('|');
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }

        return '';
    }

    /**
     * Calculates the expires in value in milliseconds for the acquired token
     * @ignore
     */
    private _expiresIn(expires): number {
        // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
        if (!expires) expires = 3599;
        return this.now() + parseInt(expires, 10);
    }

    private getCachedToken(resource): string {
        let token = this.getItem('adal.access.token.key' + resource);
        let expiry = parseInt(this.getItem('adal.expiration.key' + resource));

        // If expiration is within offset, it will force renew
        let offset = 300;
        if (expiry && (expiry > this.now() + offset)) {
            return token;
        } else {
            this.saveItem('adal.access.token.key' + resource, '');
            this.saveItem('adal.expiration.key' + resource, 0);
            return null;
        }
    }

    private getUrl(responseType = 'id_token', resource: any = null): string {
        let tenant = this.config.tenant ? this.config.tenant : 'common';
        let url = this.config.instance + tenant + '/oauth2/authorize' + this._serialize(responseType, this.config, resource) + this.addLibMetadata();
        return url;
    }

    private addLibMetadata(): string {
        // x-client-SKU
        // x-client-Ver
        return '&x-client-SKU=Js&x-client-Ver=' + this.libVersion();
    }

    private libVersion(): string {
        return '1.0.15';
    }

    /**
     * Returns the decoded id_token.
     * @ignore
     */
    private _extractIdToken(encodedIdToken) {
        // id token will be decoded to get the username
        var decodedToken = this._decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }

        try {
            var base64IdToken = decodedToken.JWSPayload;
            var base64Decoded = this._base64DecodeStringUrlSafe(base64IdToken);
            if (!base64Decoded) {
                console.warn('The returned id_token could not be base64 url safe decoded.');
                return null;
            }

            // ECMA script has JSON built-in support
            return JSON.parse(base64Decoded);
        } catch (err) {
            console.error('The returned id_token could not be decoded', err);
        }

        return null;
    }

    /**
     * Decodes a string of data which has been encoded using base-64 encoding.
     * @ignore
     */
    private _base64DecodeStringUrlSafe(base64IdToken: string): string {
        // html5 should support atob function for decoding
        base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
        if (window.atob) {
            return decodeURIComponent(encodeURI(window.atob(base64IdToken))); // jshint ignore:line
        }
        else {
            return decodeURIComponent(encodeURI(this._decode(base64IdToken)));
        }
    }

    //Take https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.js and https://en.wikipedia.org/wiki/Base64 as reference. 
    private _decode(base64IdToken: string): string {
        var codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        base64IdToken = String(base64IdToken).replace(/=+$/, '');

        var length = base64IdToken.length;
        if (length % 4 === 1) {
            throw new Error('The token to be decoded is not correctly encoded.');
        }

        var h1, h2, h3, h4, bits, c1, c2, c3, decoded = '';
        for (var i = 0; i < length; i += 4) {
            //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
            // then 6 bits per base64 encoded character
            h1 = codes.indexOf(base64IdToken.charAt(i));
            h2 = codes.indexOf(base64IdToken.charAt(i + 1));
            h3 = codes.indexOf(base64IdToken.charAt(i + 2));
            h4 = codes.indexOf(base64IdToken.charAt(i + 3));

            // For padding, if last two are '='
            if (i + 2 === length - 1) {
                bits = h1 << 18 | h2 << 12 | h3 << 6;
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                decoded += String.fromCharCode(c1, c2);
                break;
            }
            // if last one is '='
            else if (i + 1 === length - 1) {
                bits = h1 << 18 | h2 << 12
                c1 = bits >> 16 & 255;
                decoded += String.fromCharCode(c1);
                break;
            }

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            // then convert to 3 byte chars
            c1 = bits >> 16 & 255;
            c2 = bits >> 8 & 255;
            c3 = bits & 255;

            decoded += String.fromCharCode(c1, c2, c3);
        }

        return decoded;
    }

    /**
     * Decodes an id token into an object with header, payload and signature fields.
     * @ignore
     */
    // Adal.node js crack function
    private _decodeJwt(jwtToken: string) {
        if (jwtToken == null || jwtToken == '') {
            return null;
        };

        var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;

        var matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            console.warn('The returned id_token is not parseable.');
            return null;
        }

        var crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };

        return crackedToken;
    }

    /**
     * Calls the passed in callback with the user object or error message related to the user.
     * @param {userCallback} callback - The callback provided by the caller. It will be called with user or error.
     */
    private getUser(callback) {
        // IDToken is first call
        if (typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        // user in memory
        if (this._user) {
            callback(null, this._user);
            return;
        }

        // frame is used to get idtoken
        var idtoken = this.getItem('adal.idtoken');
        if (!this._isEmpty(idtoken)) {
            //this.info('User exists in cache: ');
            this._user = this._createUser(idtoken);
            callback(null, this._user);
        } else {
            //this.warn('User information is not available');
            callback('User information is not available', null);
        }
    }


    /**
     * Creates a user object by decoding the id_token
     * @ignore
     */
    private _createUser(idToken: string) {
        var user = null;
        var parsedJson = this._extractIdToken(idToken);
        if (parsedJson && parsedJson.hasOwnProperty('aud')) {
            if (parsedJson.aud.toLowerCase() === this.config.clientId.toLowerCase()) {

                user = {
                    userName: '',
                    profile: parsedJson
                };

                if (parsedJson.hasOwnProperty('upn')) {
                    user.userName = parsedJson.upn;
                } else if (parsedJson.hasOwnProperty('email')) {
                    user.userName = parsedJson.email;
                }
            } else {
                console.warn('IdToken has invalid aud field');
            }
        }

        return user;
    }

    /**
     * Adds the passed callback to the array of callbacks for the specified resource and puts the array on the window object. 
     * @param {string}   resource A URI that identifies the resource for which the token is requested.
     * @param {string}   expectedState A unique identifier (guid).
     * @param {tokenCallback} callback - The callback provided by the caller. It will be called with token or error.
     */
    private registerCallback(expectedState, resource, callback) {
        this._activeRenewals[resource] = expectedState;
        if (!(<any>window).callBacksMappedToRenewStates[expectedState]) {
            (<any>window).callBacksMappedToRenewStates[expectedState] = [];
        }
        let self = this;
        (<any>window).callBacksMappedToRenewStates[expectedState].push(callback);
        if (!(<any>window).callBackMappedToRenewStates[expectedState]) {
            (<any>window).callBackMappedToRenewStates[expectedState] = function (errorDesc, token, error) {
                self._activeRenewals[resource] = null;

                for (var i = 0; i < (<any>window).callBacksMappedToRenewStates[expectedState].length; ++i) {
                    try {
                        (<any>window).callBacksMappedToRenewStates[expectedState][i](errorDesc, token, error);
                    }
                    catch (error) {
                        console.warn(error);
                    }
                }
                (<any>window).callBacksMappedToRenewStates[expectedState] = null;
                (<any>window).callBackMappedToRenewStates[expectedState] = null;
            };
        }
    }

    /**
     * Adds the hidden iframe for silent token renewal
     * @ignore
     */
    private _addAdalFrame(iframeId) {
        if (typeof iframeId === 'undefined') {
            return;
        }

        let adalFrame: any = document.getElementById(iframeId);

        if (!adalFrame) {
            if (document.createElement && document.documentElement &&
                ((<any>window).opera || window.navigator.userAgent.indexOf('MSIE 5.0') === -1)) {
                var ifr = document.createElement('iframe');
                ifr.setAttribute('id', iframeId);
                ifr.setAttribute('aria-hidden', 'true');
                ifr.style.visibility = 'hidden';
                ifr.style.position = 'absolute';
                ifr.style.width = ifr.style.height = ifr.style.borderWidth = '0px';

                adalFrame = document.getElementsByTagName('body')[0].appendChild(ifr);
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML('beforeend', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
            }
            if (window.frames && window.frames[iframeId]) {
                adalFrame = window.frames[iframeId];
            }
        }

        return adalFrame;
    }

    /**
     * Checks if the authorization endpoint URL contains query string parameters
     * @ignore
     */
    private _urlContainsQueryStringParameter(name: string, url: string): boolean {
        // regex to detect pattern of a ? or & followed by the name parameter and an equals character
        var regex = new RegExp("[\\?&]" + name + "=");
        return regex.test(url);
    }

    /**
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time.
     * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user.
     * @ignore
     */
    private _addHintParameters(urlNavigate: string): string {
        // include hint params only if upn is present
        if (this._user && this._user.profile && this._user.profile.hasOwnProperty('upn')) {

            // don't add login_hint twice if user provided it in the extraQueryParameter value
            if (!this._urlContainsQueryStringParameter("login_hint", urlNavigate)) {
                // add login_hint
                urlNavigate += '&login_hint=' + encodeURIComponent(this._user.profile.upn);
            }

            // don't add domain_hint twice if user provided it in the extraQueryParameter value
            if (!this._urlContainsQueryStringParameter("domain_hint", urlNavigate) && this._user.profile.upn.indexOf('@') > -1) {
                var parts = this._user.profile.upn.split('@');
                // local part can include @ in quotes. Sending last part handles that.
                urlNavigate += '&domain_hint=' + encodeURIComponent(parts[parts.length - 1]);
            }
        }

        return urlNavigate;
    }

    /**
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    private _loadFrame(urlNavigate, frameName) {
        // This trick overcomes iframe navigation in IE
        // IE does not load the page consistently in iframe
        var self = this;
        //self.info('LoadFrame: ' + frameName);
        var frameCheck = frameName;
        setTimeout(function () {
            var frameHandle = self._addAdalFrame(frameCheck);
            if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                frameHandle.src = urlNavigate;
                self._loadFrame(urlNavigate, frameCheck);
            }
        }, 500);
    }

    // Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left
    // registered when network errors occur and subsequent token requests for same resource are registered to the pending request
    /**
     * @ignore
     */
    private _loadFrameTimeout(urlNavigation: string, frameName: string, resource) {
        //set iframe session to pending
        this.saveItem('adal.token.renew.status' + resource, 'In Progress');
        this._loadFrame(urlNavigation, frameName);
        var self = this;
        setTimeout(function () {
            if (self.getItem('adal.token.renew.status' + resource) === 'In Progress') {
                // fail the iframe session if it's in pending state
                //self.verbose('Loading frame has timed out after: ' + (6000 / 1000) + ' seconds for resource ' + resource);
                var expectedState = self._activeRenewals[resource];
                if (expectedState && (<any>window).callBackMappedToRenewStates[expectedState]) {
                    (<any>window).callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null, 'Token Renewal Failed');
                }

                self.saveItem('adal.token.renew.status' + resource, 'Canceled');
            }
        }, 6000);
    }

    /**
     * Acquires access token with hidden iframe
     * @ignore
     */
    private _renewToken(resource, callback) {
        // use iframe to try refresh token
        // use given resource to create new authz url
        if(resource == null || resource == '') resource = this.config.clientId;
        let frameHandle = this._addAdalFrame('adalRenewFrame' + resource);
        let expectedState = this.getGUID() + '|' + resource;
        (<any>this.config).state = expectedState; // This never seems to be used?
        // renew happens in iframe, so it keeps javascript context
        (<any>window).renewStates.push(expectedState);

        let urlNavigate = this.getUrl('token'/*, resource*/) + '&prompt=none';
        urlNavigate = this._addHintParameters(urlNavigate);

        this.registerCallback(expectedState, resource, callback);
        frameHandle.src = 'about:blank';
        this._loadFrameTimeout(urlNavigate, 'adalRenewFrame' + resource, resource);
    }

    /**
     * Renews idtoken for app's own backend when resource is clientId and calls the callback with token/error
     * @ignore
     */
    private _renewIdToken(callback) {
        // use iframe to try refresh token
        var frameHandle = this._addAdalFrame('adalIdTokenFrame');
        var expectedState = this.getGUID() + '|' + this.config.clientId;
        this._idTokenNonce = this.getGUID();
        this.saveItem('adal.nonce.idtoken', this._idTokenNonce);
        (<any>this.config).state = expectedState;  // This never seems to be used?
        // renew happens in iframe, so it keeps javascript context
        (<any>window).renewStates.push(expectedState);

       var urlNavigate = this.getUrl('id_token', null) + '&prompt=none';
        urlNavigate = this._addHintParameters(urlNavigate);

        urlNavigate += '&nonce=' + encodeURIComponent(this._idTokenNonce);
        this.registerCallback(expectedState, this.config.clientId, callback);
        this._idTokenNonce = null;
        frameHandle.src = 'about:blank';
        this._loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.config.clientId);
    }

    private saveItem(key: string, object: any): boolean {
        // check if session storage is supported if so save there
        if (this.supportSessionStorage()) {
            sessionStorage.setItem(key, object);
            return true;
        } else {
            return false;
        }
    }

    private getItem(key: string): string {
        return window.sessionStorage.getItem(key);
    }

    /**
     * Checks for the resource in the cache. By default, cache location is Session Storage
     * @ignore
     * @returns {Boolean} 'true' if login is in progress, else returns 'false'.
     */
    private _hasResource(key: string): boolean {
        var keys = this.getItem('adal.token.keys');
        return keys && !this._isEmpty(keys) && (keys.indexOf(key + '|') > -1);
    }

    private supportSessionStorage(): boolean {
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

    private _isEmpty(str: string): boolean {
        return (typeof str === 'undefined' || !str || 0 === str.length);
    }

    private decimalToHex(value: number) {
        var hex = value.toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }



    private getGUID(): string {
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

    private now(): number {
        return Math.round(new Date().getTime() / 1000.0);
    }

    private promptUser(url: string) {
        if (url) window.location.replace(url);
        else console.error("URL not provided");

    }

    /**
     * Serializes the parameters for the authorization endpoint URL and returns the serialized uri string.
     * @ignore
     */
    private _serialize(responseType, obj, resource): string {
        var str = [];
        if (obj !== null) {
            str.push('?response_type=' + responseType);
            str.push('client_id=' + encodeURIComponent(obj.clientId));
            if (resource) {
                str.push('resource=' + encodeURIComponent(resource));
            }

            str.push('redirect_uri=' + encodeURIComponent(obj.redirectUri));
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

    private getHash(hash: any): string {
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

