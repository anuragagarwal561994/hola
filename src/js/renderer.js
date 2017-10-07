"use strict";

var config = {
  apiKey: "AIzaSyDcatmPrGGXCQxRlrs_LHIpyKl3kZiBry0",
  authDomain: "halo-566cd.firebaseapp.com",
  databaseURL: "https://halo-566cd.firebaseio.com",
  projectId: "halo-566cd",
  storageBucket: "halo-566cd.appspot.com",
  messagingSenderId: "415046071342"
};

if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

const uiConfig = {
  signInSuccessUrl: '/',
  signInOptions: [{
    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    defaultCountry: 'IN'
  }]
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

const app = angular.module("app", ['ngRoute']);

app.config(function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
});

app.config(/*@ngInject*/function($routeProvider) {
  $routeProvider.when('/', {
    controller: 'homeController',
    templateUrl: 'views/home.html'
  }).when('/totp', {
    controller: 'totpController',
    templateUrl: 'views/totp.html'
  }).when('/dashboard', {
    controller: 'dashboardController',
    templateUrl: 'views/dashboard.html'
  }).when('/billing', {
    controller: 'billingController',
    templateUrl: 'views/billing.html'
  }).when('/speeddial', {
    controller: 'speeddialController',
    templateUrl: 'views/speeddial.html'
  }).when('/payments', {
    controller: 'paymentController',
    templateUrl: 'views/payment.html'
  }).otherwise({
    redirectTo: '/'
  });
});

app.service('sessionService', () => {
  let session = {};

  return {
    resetSession: function() {
      session = {};
    },
    getSession : function() {
      return session;
    },
    setSession : function(_session) {
      session = _session;
    }
  }
});

app.run(/*@ngInject*/function($rootScope, $timeout, $location, sessionService){

  $rootScope.stateIsLoading = false;
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    $rootScope.stateIsLoading = true;

    let session = sessionService.getSession();
    console.log(session);

    if (!session.hasOwnProperty('authenticated') || session.authenticated === false) {
      $location.path("/");
    } else if (!session.hasOwnProperty('totp') || session.totp === false) {
      $location.path("/totp");
    } else {
      $location.path(next.$$route['originalPath']);
    }
  });

  $rootScope.$on('$routeChangeSuccess', function() {
    $timeout(function() {
      $rootScope.stateIsLoading = false;
    }, 2000);
  });

  $rootScope.$on('$routeChangeError', function() {
    console.log("Error");
  });

});


app.controller("homeController", /*@ngInject*/function($scope, $location, sessionService) {
  firebase.auth().onAuthStateChanged(function(user) {
    console.log(user);
    if (user) {
      const displayName = user.displayName;
      const email = user.email;
      const emailVerified = user.emailVerified;
      const photoURL = user.photoURL;
      const uid = user.uid;
      const phoneNumber = user.phoneNumber;
      const providerData = user.providerData;
      const totp = user.totp;

      user.getIdToken().then((accessToken) => {
        const session = {
          displayName: displayName,
          email: email,
          emailVerified: emailVerified,
          phoneNumber: phoneNumber,
          photoURL: photoURL,
          uid: uid,
          accessToken: accessToken,
          providerData: providerData,
          authenticated: true,
          activePage: 'dashboard',
          totp: totp
        };

        sessionService.setSession(session);
        $location.path('/dashboard');
        $scope.$apply();
      });
    } else {
      console.log('Not logged in');
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, function(error) {
      console.log(error);
    });
});

app.controller("navController", /*@ngInject*/function($scope, $location, sessionService) {
  let session = sessionService.getSession();
  $scope.session = session;

  console.log(session);

  $scope.goto = (path, type) => {
    session['activePage'] = type;
    $scope.session = session;
    sessionService.setSession(session);
    $location.path(path);
  }

  $scope.logout = () => {
    firebase.auth().signOut().then(function() {
      console.log('Signed Out');
      sessionService.resetSession();
    }, function(error) {
      console.error('Sign Out Error', error);
      sessionService.resetSession();
    });
  }
});


app.controller("speeddialController", /*@ngInject*/function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("dashboardController", /*@ngInject*/function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("paymentController", /*@ngInject*/function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("billingController", /*@ngInject*/function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});
