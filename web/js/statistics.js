function StatisticsCtrl($location, $scope, $resource) {
	var year = "2014";

	var VarExCategory = $resource('/api/account_service/variable_expense_categories');
	var VarExpense = $resource('/api/account_service/variable_expenses');
	var FixExpense = $resource('/api/account_service/fixed_expenses');
	var Revenue = $resource('/api/account_service/revenues');
	var VarExTotal = $resource("/api/account_service/variable_expenses/" + year + "/totals");
	var FixExTotal = $resource("/api/account_service/fixed_expenses/" + year + "/totals");
	var RevenueTotal = $resource("/api/account_service/revenues/" + year + "/totals");

	// TODO: should be parallel
	var varExCategories;
	var varExpenses;
	var fixExpenses;
	var revenues;
	var varExTotal;
	var fixExTotal;
	var revenueTotal;

	VarExCategory.query().$promise.then(function (result) {
		varExCategories = result;
	}).then(function () {
		return VarExpense.query().$promise.then(function (result) {
			varExpenses = result;
		});
	}).then(function () {
		return FixExpense.query().$promise.then(function (result) {
			fixExpenses = result;
		});
	}).then(function () {
		return Revenue.query().$promise.then(function (result) {
			revenues = result;
		});
	}).then(function () {
		return VarExTotal.query().$promise.then(function (result) {
			varExTotal = result;
		});
	}).then(function () {
		return FixExTotal.query().$promise.then(function (result) {
			fixExTotal = result;
		});
	}).then(function () {
		return RevenueTotal.query().$promise.then(function (result) {
			revenueTotal = result;
		});
	}).then(function (result) {
		console.log(JSON.stringify(varExCategories));
		console.log(JSON.stringify(varExpenses));
		console.log(JSON.stringify(fixExpenses));
		console.log(JSON.stringify(revenues));

		var data = new Array();

		var category = pluck(varExCategories, "category");
		var items = pluck(varExCategories, "category");
		items.push("変動費合計", "固定費合計", "収入合計", "残高", "累計残高");
		console.log(items);
		data.push(items);

		for (month = 1; month <= 12; month++) {
			var date = year + '/' + ("00" + month).slice(-2);
			var period = new Array();
			category.forEach(function(v) {
				var filteredVarEx = varExpenses.filter(function(item, index) {
					return ((item.date).indexOf(date) >= 0 && item.category == v);
				});
				var categoryTotal = 0;
				filteredVarEx.forEach(function(p) {
					categoryTotal += p.price;
				});
				period.push(categoryTotal);
			});
			console.log(period);
			
			// Total
			period.push(varExTotal[month -1].total);
			period.push(fixExTotal[month -1].total);
			period.push(revenueTotal[month -1].total);
			period.push(revenueTotal[month -1].total - varExTotal[month -1].total - fixExTotal[month -1].total);
			if (month == 1) {
				period.push(period[period.length - 1]);
			} else {
				period.push(period[period.length - 1] + data[data.length - 1][period.length]);
			}
			data.push(period);
			
		}
		console.log(data);
		data = inverse(data);
		console.log(data);

		// Show table
			$("#statisticsTable").handsontable({
				data : data,
				colWidths: [100,80,80,80,80,80,80,80,80,80,80,80,80],
				readOnly: true,
				rowHeaders: false,
				colHeaders: true,
				minSpareRows: 0,
				fillHandle: true,
				colHeaders: ["項目", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
				columns: [
				{},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				{type: 'numeric',
					format: '$0,0',
					language: 'ja'},
				]
			});

	});

	

}
