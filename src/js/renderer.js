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

const app = angular.module("app", ['ngRoute', 'ngMessages']);

app.config(function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
});

app.config( /*@ngInject*/ function($routeProvider) {
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
    getSession: function() {
      return session;
    },
    setSession: function(_session) {
      session = _session;
    }
  }
});

app.run( /*@ngInject*/ function($rootScope, $timeout, $route, $window, $location, sessionService) {

  $rootScope.stateIsLoading = false;
  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    $rootScope.stateIsLoading = true;
  });

  $rootScope.$on("$locationChangeStart", function(event, next, current) {
    var path = $location.path();
    console.log('New routing called!');

    let session = sessionService.getSession();

    if (!session.hasOwnProperty('authenticated') || session.authenticated === false) {
      console.log('here');
      $location.path("/");
    } else {
      $location.path(path);
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


app.controller("homeController", /*@ngInject*/ function($scope, $location, sessionService) {
  console.log($location.path())
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
        var ref = firebase.database().ref("totp");

        ref.orderByChild('number').equalTo(phoneNumber).once('value')
          .then(function(snapshot) {
            console.log(snapshot.val());
            var totp = snapshot.child("totp").val();
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
      });
    } else {
      console.log('Not logged in');
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, function(error) {
    console.log(error);
  });
});

app.controller("navController", /*@ngInject*/ function($scope, $location, sessionService) {
  let session = sessionService.getSession();
  $scope.session = session;

  $scope.goto = (path, type) => {
    session['activePage'] = type;
    sessionService.setSession(session);
    $location.path(path);
  }

  $scope.logout = () => {
    firebase.auth().signOut().then(function() {
      console.log('Signed Out');
      sessionService.resetSession();
      $location.path("/");
    }, function(error) {
      console.error('Sign Out Error', error);
      sessionService.resetSession();
      $location.path("/");
    });
  }
});

app.directive('strongSecret', function() {
  return {
    // require NgModelController, i.e. require a controller of ngModel directive
    require: 'ngModel',

    // create linking function and pass in our NgModelController as a 4th argument
    link: function(scope, element, attr, ctrl) {
      function customValidator(ngModelValue) {
        console.log(ngModelValue);
        // check if contains number
        // if it does contain number, set our custom `numberValidator`  to valid/true
        // otherwise set it to non-valid/false
        if (/^\d+$/.test(ngModelValue)) {
          console.log('Here1');
          ctrl.$setValidity('numberValidator', true);
        } else {
          console.log('Here2');
          ctrl.$setValidity('numberValidator', false);
        }

        if (ngModelValue.length === 4) {
          console.log('Here3');
          ctrl.$setValidity('fourCharactersValidator', true);
        } else {
          console.log('Here4');
          ctrl.$setValidity('fourCharactersValidator', false);
        }

        // we need to return our ngModelValue, to be displayed to the user(value of the input)
        return ngModelValue;
      }

      ctrl.$parsers.push(customValidator);
    }
  };
});


app.controller("totpController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("speeddialController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("dashboardController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();

  $scope.name = $scope.session.displayName;
  $scope.email = $scope.session.email;
  $scope.strongSecret = $scope.session.totp;

  $scope.updateProfile = () => {
    const databaseRef = firebase.database().ref().child('totp');
    const querybaseRef = querybase.ref(databaseRef, ['number', 'user_id']);

    let session = sessionService.getSession();

    querybaseRef.push({
      number: session.phoneNumber,
      user_id: session.uid,
      pascode: $scope.strongSecret,
      name: $scope.name,
      email: $scope.email
    });
  }
});


app.controller("paymentController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("billingController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});
