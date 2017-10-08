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

const app = angular.module("app", ['ngRoute', 'ngMessages']);

app.config(function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
});

app.config( /*@ngInject*/ function($routeProvider) {
  $routeProvider.when('/', {
    controller: 'homeController',
    templateUrl: 'views/home.html'
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

      console.log(phoneNumber, uid);

      user.getIdToken().then((accessToken) => {
        console.log(user, accessToken);
        const databaseRef = firebase.database().ref().child('totp');
        const querybaseRef = querybase.ref(databaseRef, ['number', 'user_id']);
        const queriedDbRef = querybaseRef
          .where({
            number: phoneNumber,
            user_id: uid
          });

        queriedDbRef.on('value', (snapshot) => {
          console.log(snapshot.val());

          var totp = null;
          var name = null;
          var email = null;

          if (snapshot.val() !== null && snapshot.val() !== undefined) {
            const vals = Object.values(snapshot.val());

            totp = vals[0]["passcode"]
            name = vals[0]["name"]
            email = vals[0]["email"]
          }

          console.log(totp, name, email);

          const session = {
            displayName: name,
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
      const uiConfig = {
        signInSuccessUrl: '/',
        signInOptions: [{
          provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: 'IN'
        }]
      };

      const ui = new firebaseui.auth.AuthUI(firebase.auth());
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


app.controller("speeddialController", /*@ngInject*/ function($scope, $location, sessionService) {
  console.log('speedDial called!');
  $scope.session = sessionService.getSession();

  $scope.dial = {
    '1': {
      'name': 'one',
      'speed_number_prefix': 'speed_number_one'
    },
    '2': {
      'name': 'two',
      'speed_number_prefix': 'speed_number_two'
    },
    '3': {
      'name': 'three',
      'speed_number_prefix': 'speed_number_three'
    },
    '4': {
      'name': 'four',
      'speed_number_prefix': 'speed_number_four'
    },
    '5': {
      'name': 'five',
      'speed_number_prefix': 'speed_number_five'
    },
    '6': {
      'name': 'six',
      'speed_number_prefix': 'speed_number_six'
    },
    '7': {
      'name': 'seven',
      'speed_number_prefix': 'speed_number_seven'
    },
    '8': {
      'name': 'eight',
      'speed_number_prefix': 'speed_number_eight'
    },
    '9': {
      'name': 'nine',
      'speed_number_prefix': 'speed_number_nine'
    }
  };

  let session = sessionService.getSession();

  Object.keys($scope.dial).forEach(function(currentKey) {
    const databaseRef = firebase.database().ref().child('speed_dials');
    const querybaseRef = querybase.ref(databaseRef, ['key', 'user_number', 'key_choice']);

    const queriedDbRef = querybaseRef
      .where({
        user_number: session.phoneNumber,
        key: session.uid,
        key_choice: currentKey
      });

    console.log(currentKey);

    queriedDbRef.on('value', (snapshot) => {
      const val = snapshot.val();

      if (val !== null) {
        const key = Object.keys(val)[0];

        const name = val[key]['name'];
        const number = val[key]['number'];

        console.log('FOUND! ', currentKey, name, number);

        if (name !== '' && number !== '') {
          console.log('#' + $scope.dial[currentKey].name, '#' + $scope.dial[currentKey].speed_number_prefix);
          jQuery('#' + $scope.dial[currentKey].name).val(name);
          jQuery('#' + $scope.dial[currentKey].speed_number_prefix).val(number);

          jQuery('#' + $scope.dial[currentKey].name).prop('disabled', true);
          jQuery('#' + $scope.dial[currentKey].speed_number_prefix).prop('disabled', true);
        }
      }
    });
  });

  $scope.deleteContact = (keychoice) => {
    console.log(keychoice);
    let session = sessionService.getSession();

    const databaseRef = firebase.database().ref().child('speed_dials');
    const querybaseRef = querybase.ref(databaseRef, ['key', 'user_number', 'key_choice']);

    const queriedDbRef = querybaseRef
      .where({
        user_number: session.phoneNumber,
        key: session.uid,
        key_choice: keychoice
      });

    queriedDbRef.on('value', (snapshot) => {
      const val = snapshot.val();

      if (val !== null) {
        const key = Object.keys(val)[0];

        console.log('Here2', $scope.dial[keychoice].name);
        const name = jQuery('#' + $scope.dial[keychoice].name).val();
        const number = jQuery('#' + $scope.dial[keychoice].speed_number_prefix).val();

        const databaseRef = firebase.database().ref().child(`speed_dials/${key}`);
        databaseRef.remove().then((resp) => {
          console.log(resp);
          jQuery('#' + $scope.dial[keychoice].name).val('');
          jQuery('#' + $scope.dial[keychoice].speed_number_prefix).val('');
          jQuery('#' + $scope.dial[keychoice].name).prop('disabled', false);
          jQuery('#' + $scope.dial[keychoice].speed_number_prefix).prop('disabled', false);
        });
      }
    });
  }

  $scope.updateSpeedDial = () => {
    let session = sessionService.getSession();
    console.log(session);

    for (var i in $scope.dial) {
      const databaseRef = firebase.database().ref().child('speed_dials');
      const querybaseRef = querybase.ref(databaseRef, ['key', 'user_number', 'key_choice']);

      const queriedDbRef = querybaseRef
        .where({
          user_number: session.phoneNumber,
          key: session.uid,
          key_choice: i
        });

      queriedDbRef.on('value', (snapshot) => {
        console.log('Here2', $scope.dial[i].name);
        var name = jQuery('#' + $scope.dial[i].name).val();
        var number = jQuery('#' + $scope.dial[i].speed_number_prefix).val();

        console.log('lol', number, name);

        if (snapshot.val() === null && number !== '' && name !== '') {
          querybaseRef.push({
            user_number: session.phoneNumber,
            key: session.uid,
            key_choice: i,
            number: number,
            name: name
          });
          jQuery('#' + $scope.dial[i].name).prop('disabled', true);
          jQuery('#' + $scope.dial[i].speed_number_prefix).prop('disabled', true);
        }
      });
    }
  }
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

    const queriedDbRef = querybaseRef
      .where({
        number: session.phoneNumber,
        user_id: session.uid
      });

    queriedDbRef.on('value', (snapshot) => {
      if (snapshot.val() === null) {
        querybaseRef.push({
          number: session.phoneNumber,
          user_id: session.uid,
          passcode: $scope.strongSecret,
          name: $scope.name,
          email: $scope.email
        });
      } else {
        const val = snapshot.val();
        const key = Object.keys(val)[0];

        const databaseRef = firebase.database().ref().child(`totp/${key}`);
        databaseRef.update({
          passcode: $scope.strongSecret,
          name: $scope.name,
          email: $scope.email
        }).then((resp) => {
          console.log(resp);
        });
      }
    });
  }
});


app.controller("paymentController", /*@ngInject*/ function($scope, $location, sessionService) {
  $scope.session = sessionService.getSession();
});


app.controller("billingController", /*@ngInject*/ function($scope, $http, $location, sessionService) {
  $scope.session = sessionService.getSession();

  const phoneNumber = $scope.session.phoneNumber;

  $http.get(`https://api.plivo.com/v1/Account/MANWQ0MMY2MTMZY2MYYJ/Call?call_direction=outbound&from_number=${phoneNumber}`, {
    headers: {
      'Authorization': 'Basic TUFOV1EwTU1ZMk1UTVpZMk1ZWUo6WmpBNVkyWTVNREUzWkRBek0ySm1PVGd3T1RjMk1UYzROamM0TmpreQ=='
    }
  }).success(function(data) {
    console.log(data);

  }).error(function(e) {
    console.log(e);
  });
});
