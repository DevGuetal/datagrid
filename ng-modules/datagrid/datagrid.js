/**  
 * The file contains:
 * - Controller for datagrid module
 * - a factory to parse the data 
 * - custom sorting directive to sort the data
 */

var datagridModule = angular.module('datagrid', []);


/**
 * module controller 
 */
datagridModule.controller('datagridController', function ($scope, $http, $filter, dataFactory) {

    // init
    $scope.sort = {       
                sortingOrder : 'id',
                reverse : false
            };
        
    $scope.itemsPerPage = 9;
    $scope.currentPage = 0;
    $scope.loadingShow = true;
    
    
    //the datamodel
    $scope.model = {
    	items : [],
    	pagedItems : []
    };

    var searchMatch = function (haystack, needle) {
        if (!needle) {
            return true;
        }
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
    };

    // init the filtered items
    $scope.search = function () {
        $scope.filteredItems = $filter('filter')($scope.model.items, function (item) {
            for(var attr in item) {
                if (searchMatch(item[attr], $scope.query))
                    return true;
            }
            return false;
        });
        // take care of the sorting order
        if ($scope.sort.sortingOrder !== '') {
            $scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sort.sortingOrder, $scope.sort.reverse);
        }
        $scope.currentPage = 0;
                
        // now group by pages
        $scope.groupToPages();
    };
    
  
    // calculate page in place
    $scope.groupToPages = function () {
        $scope.model.pagedItems = [];
        
        for (var i = 0; i < $scope.filteredItems.length; i++) {
            if (i % $scope.itemsPerPage === 0) {
                $scope.model.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
            } else {
                $scope.model.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
            }
        }
    };
      
    //navigate to previous 9 items
    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };
    
   //navigate to next 9 items
    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.model.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    };
    
    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };

    // process the data for display
    $scope.search();

    success = function(data, status, headers, config) {
    	
    	if(!data) {
    		alert("Ooops!... Looks like there was an issue with the call to the server.");
    	}
    	
    	dataFactory.parseData($scope, data);
    	
    	$scope.loadingShow = null;
    	
    	// functions have been describe process the data for display
        $scope.search();
    };
    
    //invoking the server to fetch the data. Using jsonp instead of standard get because the domain is different
    $http.jsonp('https://spreadsheets.google.com/feeds/list/19gNZdfi2q-i3FehnSbFmLcLekyOdX6084DywdguwIic/1/public/values?alt=json&callback=success');
});


/**
 * Data Factory 
 */

//service used to build the datamodel
datagridModule.factory('dataFactory', function(){
	var factory = {};
	
	factory.parseData = function($scope, data) {
    	$scope.model.items = $scope.model.items || [];
    	
    	for(index in data.feed.entry) {
    		var currentEntry = data.feed.entry[index];
    		$scope.model.items[index] = {
    				"ticker":currentEntry.gsx$ticker.$t,
    				"industry":currentEntry.gsx$industry.$t,
    				"marketcap":currentEntry.gsx$marketcap.$t,
    				"price":currentEntry.gsx$price.$t,
    				"change":currentEntry.gsx$change.$t,
    				"volume":currentEntry.gsx$volume.$t
    		};
    	}
    };
    
    return factory;
});

datagridModule.$inject = ['$scope', '$http','$filter', 'dataFactory'];



/**
 * Custom sort directive 
 */

//directive used to perform custom search
datagridModule.directive("customSort", function() {
return {
    restrict: 'A',
    transclude: true,    
    scope: {
      order: '=',
      sort: '='
    },
    template : 
      ' <a ng-click="sort_by(order)" class="{{selectedCls(order)}}">'+
      '    <span ng-transclude></span>'+
      '    <i ng-class="toggleCls(order)"></i>'+
      '</a>',
    link: function(scope) {
    
    //depending on the type of data, we parse the item to a number so that we can perform comparison
    scope.sort.mySortFunction = function(item) {
    	var result;
    	var orderBy = scope.sort.sortingOrder;
    	
    	switch(orderBy) {
	    	case 'price':  
	    		var priceString = item [orderBy];
	    		var noFormatPrice = priceString.substring(1).split('.').join("");
	    		
	    		result = parseFloat(noFormatPrice);
	    		break;
	    	case 'marketcap':
	    		var mcString = item [orderBy];
	    		var noFormatMC  = mcString.split('.').join("").split(',').join("");
	    		result = parseFloat(noFormatMC);
	    		break;
	    	case 'change':
	    		var percentageString = item [orderBy];
	    		var noFormatMC  = percentageString.substring(0, percentageString.length-1).split('.').join("");
	    		result = parseFloat(noFormatMC);
	    		break;
	    	case 'volume':
	    		var mcString = item [orderBy];
	    		var noFormatMC  = mcString.split('.').join("").split(',').join("");
	    		result = parseFloat(noFormatMC);
	    		break;
	    	default: 
	    		result = item [orderBy];
	    		break;
    	}
    	
    	return result;
    };	
    
    // change sorting order
    scope.sort_by = function(newSortingOrder) {       
        var sort = scope.sort;
        
        if (sort.sortingOrder == newSortingOrder){
            sort.reverse = !sort.reverse;
        }                    

        sort.sortingOrder = newSortingOrder; 
    };
        
    scope.selectedCls = function(column) {
        if(column == scope.sort.sortingOrder){
            return 'selected';
        } else {            
            return'' 
        } 
    };     
   
    scope.toggleCls = function(column) {
        if(column == scope.sort.sortingOrder){
            return ('icon-chevron-' + ((scope.sort.reverse) ? 'down' : 'up'));
        } else {            
            return'icon-sort'; 
        } 
    };      
  }// end link
}
});
