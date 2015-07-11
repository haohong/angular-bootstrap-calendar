'use strict';

var angular = require('angular');

angular
  .module('mwl.calendar')
  .controller('MwlCalendarCtrl', function($scope, $timeout, $window, $locale, moment, calendarTitle, calendarDebounce) {

    var vm = this;

    $scope.events = $scope.events || [];

    vm.changeView = function(view, newDay) {
      $scope.view = view;
      $scope.currentDay = newDay;
    };

    vm.drillDown = function(date) {

      var rawDate = moment(date).toDate();

      var nextView = {
        year: 'month',
        month: 'day',
        week: 'day'
      };

      if ($scope.onDrillDownClick({calendarDate: rawDate, calendarNextView: nextView[$scope.view]}) !== false) {
        vm.changeView(nextView[$scope.view], rawDate);
      }

    };

    var previousDate = moment($scope.currentDay);
    var previousView = angular.copy($scope.view);

    //Use a debounce to prevent it being called 3 times on initialisation
    var refreshCalendar = calendarDebounce(function() {
      if (calendarTitle[$scope.view]) {
        $scope.viewTitle = calendarTitle[$scope.view]($scope.currentDay);
      }

      $scope.events = $scope.events.map(function(event, index) {
        Object.defineProperty(event, '$id', {enumerable: false, value: index});
        return event;
      });

      //if on-timespan-click="calendarDay = calendarDate" is set then dont update the view as nothing needs to change
      var currentDate = moment($scope.currentDay);
      var shouldUpdate = true;
      if (previousDate.clone().startOf($scope.view).isSame(currentDate.clone().startOf($scope.view)) && !previousDate.isSame(currentDate) &&
        $scope.view === previousView) {
        shouldUpdate = false;
      }
      previousDate = currentDate;
      previousView = angular.copy($scope.view);

      if (shouldUpdate) {
        $scope.$broadcast('calendar.refreshView');
      }
    }, 50);

    //Auto update the calendar when the locale changes
    $scope.$watch(function() {
      return moment.locale() + $locale.id;
    }, refreshCalendar);

    //Refresh the calendar when any of these variables change.
    $scope.$watch('currentDay', refreshCalendar);
    $scope.$watch('view', refreshCalendar);
    $scope.$watch('events', refreshCalendar, true);

  })
  .directive('mwlCalendar', function() {

    return {
      template: require('./../templates/calendar.html'),
      restrict: 'EA',
      scope: {
        events: '=',
        view: '=',
        viewTitle: '=',
        currentDay: '=',
        editEventHtml: '=',
        deleteEventHtml: '=',
        autoOpen: '=',
        onEventClick: '&',
        onEventTimesChanged: '&',
        onEditEventClick: '&',
        onDeleteEventClick: '&',
        onTimespanClick: '&',
        onDrillDownClick: '&',
        cellModifier: '&',
        dayViewStart: '@',
        dayViewEnd: '@',
        dayViewSplit: '@'
      },
      controller: 'MwlCalendarCtrl as vm'
    };

  });
