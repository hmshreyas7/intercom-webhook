import React, { Component } from 'react';

import { SubmitButton } from './Button';
import { CloseButton } from './UtilComponents';

import './css/AuthCard.css';

/* Input types */
class TextField extends Component {
  render() {
    return (
      <div className="input-wrapper">
        <span className="icon">
          <i className={ "fa " + this.props.icon } aria-hidden="true"></i>
        </span>
        <input type="text" className={this.props.className}
               name={this.props.name} placeholder={this.props.placeholder}
               value={this.props.value}
               onChange={this.props.onTextChange} required />
        {
          this.props.error &&
          <span className="error-text">{this.props.error}</span>
        }
      </div>
    )
  }
}

class PasswordField extends Component {
  constructor(props) {
    super(props);

    this.state = { passwordVisible: false };
    this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
  }

  togglePasswordVisibility(event) {
    this.setState((prevState, props) => {
      return { passwordVisible: !prevState.passwordVisible };
    });
  }

  render() {
    const inp_type = this.state.passwordVisible ? "text" : "password";
    const vis_icon = this.state.passwordVisible ? "fa-eye-slash" : "fa-eye";

    return (
      <div className="input-wrapper">
        <span className="icon">
          <i className="fa fa-lock" aria-hidden="true"></i>
        </span>
        <input type={inp_type} className={this.props.className}
               name={this.props.name} placeholder={this.props.placeholder}
               value={this.props.value}
               onChange={this.props.onTextChange} required />
        <span className="view-icon" onClick={this.togglePasswordVisibility} >
          <i className={ "fa " + vis_icon } aria-hidden="true"></i>
        </span>
        {
          this.props.error &&
          <span className="error-text">{this.props.error}</span>
        }
      </div>
    )
  }
}

/**
 * Provides a full window room for components.
 * Captures all pointer events outside the children component
 * regions, and prevents them from bubbling further.
 */
class ModalWindow extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) { event.preventDefault(); }

  render() {
    return (
      <div className="modal-window">
        <div className="modal-window-container" onClick={this.handleClick}>
        {this.props.children}
        </div>
      </div>
    )
  }
}

class AuthCard extends Component {
  constructor(props) {
    super(props);

    this.styles = {
      backgroundImage: 'url(' + this.props.coverImage + ')'
    }
    this.state = { username: '', password: '', errors: null };

    // Login button state texts
    this.loginTexts = {
      'idle': 'Login now', 'processing': 'Logging in',
      'success': 'Logged in', 'error': 'Error'
    };

    // Reference to the Form DOM
    this.form = null;

    // Bind methods to this
    this.triggerLogin = this.triggerLogin.bind(this);
    this.triggerClose = this.triggerClose.bind(this);
    this.getValidationErrors = this.getValidationErrors.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
  }

  getValidationErrors() {
    // Error info
    let error = {};
    
    // Check if username violates any validation rules
    if (this.state.username.length === 0)
      error.username = 'Username cannot be empty';

    // Check if password violates any validation rules
    if (this.state.password.length === 0)
      error.password = 'Password cannot be empty';
    else if (this.state.password.length < 6)
      error.password = 'Password must be greater than 5 characters';

    // Return null if {error} is empty, or else the object itself
    return Object.keys(error).length === 0 ? null : error;
  }

  handleTextChange(event) {
    // Get current state
    let _errors = this.state.errors;
    // If {_errors} is valid reset the error value for
    // currently active textfield
    if (_errors) { _errors[event.target.name] = null; }

    this.setState({
      [event.target.name]: event.target.value, errors: _errors
    });
  }

  triggerLogin(event) {
    let _errors = {};

    if ((_errors = this.getValidationErrors())) {
      this.setState({ errors: { ..._errors } });
    } else {
      // Perform login here
    }
  }

  triggerClose(event) { this.props.onClose && this.props.onClose(event); }

  render() {
    // Test for validation errors
    let _errors = this.state.errors ? this.state.errors : {};

    return (
      <ModalWindow>
        <div className="auth-card auth-card-position">
          <div className="auth-card-adv" style={this.styles}>
            <div className="auth-card-adv-container">
              <div className="disclaimer">
                Developer Dashboard
              </div>
              <div className="disclaimer-info">
                Dashboard allows you to create reply hints for the Intercom
                app to better interact with the end-user.
              </div>
            </div>
          </div>
          <div className="auth-card-form-section">
            <CloseButton size="1rem" onClick={this.triggerClose} />
            <form className="auth-login-form" ref={(dom) => { this.form = dom; }} >
              <div className="form-title">Sign in to Dashboard</div>
              <TextField className="input-username" icon="fa-user" name="username"
                         placeholder="Username" value={this.state.username}
                         onTextChange={this.handleTextChange}
                         error={ _errors.username } />
              <PasswordField className="input-password" name="password"
                             placeholder="Password" value={this.state.password}
                             onTextChange={this.handleTextChange}
                             error={ _errors.password } />
              <SubmitButton onSubmit={this.triggerLogin} values={this.loginTexts}
                            className="btn-login" state="idle" />
            </form>
          </div>
        </div>
      </ModalWindow>
    )
  }
}

export default AuthCard;