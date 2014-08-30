var app = angular.module("AccountBook", ["ngResource", 'ngRoute', 'ngAnimate', 'wc.Directives']);

app.config(function($routeProvider, $locationProvider) {
 
  $routeProvider.when('/input', {
    templateUrl: 'template/input.html',
    controller:InputCtrl
  });
 
  $routeProvider.when('/statistics', {
    templateUrl: 'template/statistics.html',
    controller:StatisticsCtrl
  });
});
 
 
app.config(function($locationProvider) {
      $locationProvider.html5Mode(true);
});

function MenuCtrl($location, $scope) {
	$location.path('/input');
	
	$scope.input = function() {
		$location.path('/input');
	};
	
	$scope.statistics = function() {
		$location.path('/statistics');
	};
}

function pluck(array, property) {
	var rv = [];

	for (i = 0; i < array.length; ++i) {
		rv[i] = array[i][property];
	}

	return rv;
}

function inverse(array) {
	var swaps = new Array(array[0].length);
	for (var i = 0; i < array[0].length; i++) {
		swaps[i] = new Array(array.length);
		for (var j = 0; j < array.length; j++) {
			swaps[i][j] = array[j][i];
		}
	}
	return swaps;
}
