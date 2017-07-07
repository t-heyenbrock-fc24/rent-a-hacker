'use strict';

// export function
module.exports = function isLoggedIn(req, res, next) {
    // check, if user-objects exists in the current session
    if (req.session.user) {
        // user is logged in, call next
        return next();
    } else {
        // user is not logged in, redirect to login page with notification message
        req.session.message = 'Please login to see that page.';
        res.redirect('/users/login');
    }
}
