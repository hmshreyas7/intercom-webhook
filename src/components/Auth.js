
import { appLog } from './UtilComponents';

const LOCAL_STORAGE = window.localStorage;

const HASURA_DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json; charset=utf-8'
};

/* A thin wrapper for Fetch; handles errors nicely.
 * mFetch? It's just modified Fetch. */
export const mFetch = (url, request_options, onSuccess, onError) => {
  // Assuming {onSuccess} and {onError} are always passed
  fetch(url, request_options)
  .then((response) => {
    // Check for failure and report
    if (!response.ok) throw response.json();
    return response.json();
  }).then((result) => { onSuccess(result); })
  .catch((error) => {
    // If error is a Promise type, it was probably
    // thrown from the response block. Report server error
    if (error.constructor === Promise) {
      // Get the data wrapped by Promise
      error.then((data) => { onError(data, true); });
    } else { onError(error, false); }
  });
}

class Auth {
  constructor() {
    let _user = LOCAL_STORAGE.getItem('hasura_intercom.user');

    if (_user) {
      // {_user} is a stringified JSON
      this.user = JSON.parse(_user);
    } else { this.user = {}; }

    // Hasura app configuration
    this.config = { cluster: 'cannibalism26' }
    
    // Hasura API endpoints
    this.urls = {
      auth: "https://auth." + this.config.cluster + ".hasura-app.io",
      data: "https://data." + this.config.cluster + ".hasura-app.io"
    }

    // Bind class methods to this.
    // Auth getters and setters
    this.getUsername = this.getUsername.bind(this);
    this.setUsername = this.setUsername.bind(this);
    this.setUserInfo = this.setUserInfo.bind(this);

    // User data functions
    this.saveUser = this.saveUser.bind(this);
    this.clearUser = this.clearUser.bind(this);
    this.clearSession = this.clearSession.bind(this);

    // User auth functions
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);

    // Locks
    this.tryAcquireLock = this.tryAcquireLock.bind(this);
    this.releaseLock = this.releaseLock.bind(this);

    // Hasura status code constants
    this.INVALID_CREDENTIALS = 'invalid-creds';
  }

  getUsername() { return this.isLoggedIn() ? this.user.username : ''; }
  setUsername(username) { this.user.username = username; this.saveUser(); }

  setUserInfo(user_info) {
    // Populate data
    this.user.id = user_info.hasura_id;
    this.user.roles = user_info.hasura_roles;
    this.user.token = user_info.auth_token;

    this.saveUser();
  }

  saveUser() {
    LOCAL_STORAGE.setItem('hasura_intercom.user', JSON.stringify(this.user));
  }

  clearSession() { this.clearUser(); }
  clearUser() { this.user = {}; this.saveUser(); }
  isLoggedIn() { return this.user && this.user.token; }

  /**
   * Tries to acquire a lock.
   * Returns true if successful, false if not
   */
  tryAcquireLock() {
    if (this.auth_lock) return false;
    this.auth_lock = true; return true;
  }

  releaseLock() { if (this.auth_lock) delete this.auth_lock; }

  login(_username, _password, onSuccess, onError) {
    // Try to acquire a lock. Return if not successful
    if (!this.tryAcquireLock()) return;

    // Populate user data
    this.setUsername(_username);

    let user_data = {
      "provider": "username",
      "data": { "username": this.user.username, "password": _password }
    };

    // Use fetch to login
    let login_url = this.urls.auth + '/v1/login';
    // Request options
    let request_opts = {
      'method': 'POST',
      'headers': HASURA_DEFAULT_HEADERS,
      'body': JSON.stringify(user_data)
    }

    // Using the custom Fetch function defined above
    mFetch(
      login_url, request_opts,
      // Success callback
      (result) => {
        // Serialize user data
        this.setUserInfo({
          'hasura_id': result.hasura_id,
          'hasura_roles': result.hasura_roles,
          'auth_token': result.auth_token
        });

        onSuccess && onSuccess(this.user.username);

        // Release lock for further calls
        this.releaseLock();
      },
      // Error callback
      (error, isObject) => {
        let data = isObject ? error.code : error;
        // Log errors if no callbacks are provided
        if (onError) { onError(data); } else { appLog(data, true); }

        // Release lock for further calls
        this.releaseLock();
      }
    );
  }

  logout(onSuccess, onError) {
    // Try to acquire a lock. Return if not successful
    if (!this.tryAcquireLock()) return;

    // Return if no user is logged in
    if (!this.isLoggedIn()) return;

    // Use fetch to login
    let logout_url = this.urls.auth + '/v1/user/logout';
    // Request options
    let request_opts = {
      'method': 'POST',
      'headers': {
        ...HASURA_DEFAULT_HEADERS, 'Authorization': 'Bearer ' + this.user.token
      }
    }

    mFetch(
      logout_url, request_opts,
      // Success callback
      (result) => {
        // Remove serialized user data
        this.clearSession();
        onSuccess && onSuccess(result.message);

        // Release lock for further calls
        this.releaseLock();
      },
      // Error callback
      (error, isObject) => {
        let data = isObject ? error.message : error;
        // Log errors if no callbacks are provided
        if (onError) { onError(data); } else { appLog(data, true); }

        // Release lock for further calls
        this.releaseLock();
      }
    );
  }
}

export default Auth;
