angular.module("accountBook", ["ngResource"]);

function input($scope, $http){

	$.datepicker.setDefaults( $.datepicker.regional[ "ja" ] );

	dd = new Date();
	yy = dd.getYear();
	mm = dd.getMonth() + 1;
	dd = dd.getDate();
	if (yy < 2000) { yy += 1900; }
	if (mm < 10) { mm = "0" + mm; }
	if (dd < 10) { dd = "0" + dd; }

	$("#month").text(yy + "/" + mm);
	$("#date").val(yy + "/" + mm + "/" + dd);
	var date = $("#date").val();
	var month = $("#month").text();
	var syncCount;

	showTotals();

	function showTotals() {
		var varExTotal, fixExTotal, revenueTotal, subtotal;
		numeral.language("ja");
		numeral.defaultFormat('$0,0');

		$.ajax({
			url: "/api/account_service/variable_expenses/" + month.replace("/", "-") + "/total",
			success: function(html){
				varExTotal = parseInt(html);
			}
		}).pipe(function() {
			return $.ajax({
				url: "/api/account_service/fixed_expenses/" + month.replace("/", "-") + "/total",
				success: function(html){
					fixExTotal = parseInt(html);
				}
			});
		}).done(function() {
			return $.ajax({
				url: "/api/account_service/revenues/" + month.replace("/", "-") + "/total",
				success: function(html){
					revenueTotal = parseInt(html);
					subtotal = revenueTotal - (varExTotal + fixExTotal);
					$("#varExpenseTotal").text(numeral(varExTotal).format());
					$("#fixExpenseTotal").text(numeral(fixExTotal).format());
					$("#revenueTotal").text(numeral(revenueTotal).format());
					$("#subtotal").text(numeral(subtotal).format());
				}
			});
		})
	}

	var varExCategories;
	var varExpenses;
	var varExTable;
	var $varExContainer = $("#varExpense");
	var varExHandsontable;

	var fixExpenses;
	var fixExTable;
	var $fixExContainer = $("#fixExpense");
	var fixExHandsontable;

	var revenues;
	var revenueTable;
	var $revenueContainer = $("#revenue");
	var revenueHandsontable;

	promiseA = $http({
		method : 'GET',
		url : "/api/account_service/variable_expense_categories",
	}).
		then(function(data, status, headers, config) {
		varExCategories = data.data;
	});
	promiseB = promiseA.then(function() {
		$http({
			method : 'GET',
			url : "/api/account_service/variable_expenses",
		}).
			then(function(data, status, headers, config) {
			varExTable = JSON.parse(JSON.stringify(data.data.filter(function(item, index){
				if (item.date == date) return true;
			})));
			$varExContainer.handsontable({
				data : varExTable,
				//colWidths: 120,
				rowHeaders: true,
				colHeaders: true,
				contextMenu: ['row_above', 'row_below', 'hsep1', 'undo', 'redo'],
				minSpareRows: 1,
				fillHandle: true,
				colHeaders: ["カテゴリ", "項目名", "金額"],
				columns: [
					{
					data: "category",
					type: 'dropdown',
					source: pluck(varExCategories, "category")
				},
				{data: "item"},
				{data: "price",
					type: 'numeric',
					format: '$0,0',
					language: 'ja'}
				]
			});
			varExHandsontable = $varExContainer.handsontable('getInstance');
		})
	});
	promiseC = promiseB.then(function() {
		$http({
			method : 'GET',
			url : "/api/account_service/fixed_expenses",
		}).
			then(function(data, status, headers, config) {
			fixExTable = JSON.parse(JSON.stringify(data.data.filter(function(item, index){
				if (item.month == month) return true;
			})));
			$fixExContainer.handsontable({
				data : fixExTable,
				//colWidths: 120,
				rowHeaders: true,
				colHeaders: true,
				contextMenu: ['row_above', 'row_below', 'hsep1', 'undo', 'redo'],
				minSpareRows: 1,
				fillHandle: true,
				colHeaders: ["項目名", "金額"],
				columns: [
					{data: "item"},
					{data: "price",
						type: 'numeric',
						format: '$0,0',
						language: 'ja'}
				]
			});
			fixExHandsontable = $fixExContainer.handsontable('getInstance');
		})
	});
	promiseD = promiseC.then(function() {
		$http({
			method : 'GET',
			url : "/api/account_service/revenues",
		}).
			then(function(data, status, headers, config) {
			revenueTable = JSON.parse(JSON.stringify(data.data.filter(function(item, index){
				if (item.month == month) return true;
			})));
			$revenueContainer.handsontable({
				data : revenueTable,
				//colWidths: 120,
				rowHeaders: true,
				colHeaders: true,
				contextMenu: ['row_above', 'row_below', 'hsep1', 'undo', 'redo'],
				minSpareRows: 1,
				fillHandle: true,
				colHeaders: ["項目名", "金額"],
				columns: [
					{data: "item"},
					{data: "price",
						type: 'numeric',
						format: '$0,0',
						language: 'ja'}
				]
			});
			revenueHandsontable = $revenueContainer.handsontable('getInstance');
		})
	});

	function pluck(array, property) {
		var rv = [];

		for (i = 0; i < array.length; ++i) {
			rv[i] = array[i][property];
		}

		return rv;
	}

	function updateTable(element) {
		var url = getUpdateList(element);
		$http({
			method : 'GET',
			url : url,
		}).
			success(function(data, status, headers, config) {
			console.log("Fecth varExCategoryList: " + JSON.stringify(data));
			var table = JSON.parse(JSON.stringify(data.filter(function(item, index){
				return getWhere(element, item);
			})));
			getHandsontable(element).loadData(table);
		});
	};

	$("#date").change(function () {
		console.log("date changed");
		date = $("#date").val();
		updateTable("submitVarExpense");
	});

	function getCols(element) {
		switch (element) {
			case "submitVarExpense":
				return ["date", "category", "item", "price"];
			case "submitFixExpense":
				return ["month", "item", "price"];
			case "submitRevenue":
				return ["month", "item", "price"];
			default:
				return null;
		}
	}

	function getTargetList(element) {
		switch (element) {
			case "submitVarExpense":
				return "/api/account_service/variable_expenses";
			case "submitFixExpense":
				return "/api/account_service/fixed_expenses";
			case "submitRevenue":
				return "/api/account_service/revenues";
			default:
				return null;
		}
	}

	function getTable(element) {
		switch (element) {
			case "submitVarExpense":
				return varExHandsontable.getData();
			case "submitFixExpense":
				return fixExHandsontable.getData();
			case "submitRevenue":
				return revenueHandsontable.getData();
			default:
				return null;
		}
	}

	function getUpdateList(element) {
		switch (element) {
			case "submitVarExpense":
				return "/api/account_service/variable_expenses";
			case "submitFixExpense":
				return "/api/account_service/fixed_expenses";
			case "submitRevenue":
				return "/api/account_service/revenues";
			default:
				return null;
		}
	}

	function getHandsontable(element) {
		switch (element) {
			case "submitVarExpense":
				return varExHandsontable;
			case "submitFixExpense":
				return fixExHandsontable;
			case "submitRevenue":
				return revenueHandsontable;
			default:
				return null;
		}
	}

	function getWhere(element, item) {
		switch (element) {
			case "submitVarExpense":
				return (item.date == date);
			case "submitFixExpense":
				return (item.month == month);
			case "submitRevenue":
				return (item.month == month);
			default:
				return false;
		}
	}

	$(".submit").click(function () {
		var id = $(this).attr("id");
		var previous = {"category": null, "item": null, "price": null};
		var cols = getCols(id);
		var targets = new Array();
		var url	= getTargetList(id);
		var table = getTable(id);
		var rows = table.length;
		var breakFlag = false;
		for (var row in table) {
			if (row == rows - 1) {
				break;
			}
			for (var i in cols) {
				var col = cols[i];
				console.log(table[row][col]);
				if (table[row][col] == undefined) {
					table[row][col] == null;
				}
				if (col == "date" && table[row][col] == null) {
					table[row][col] = date;
				}
				if (col == "month" && table[row][col] == null) {
					table[row][col] = month;
				}
				if (col == "price" && table[row][col] == null) {
					breakflag = true;
					break;
				}
				if (table[row][col] == null) {
					if (previous[col] == null) {
						breakFlag = true;
						break;
					}
				} else {
					previous[col] = table[row][col];
				}
				table[row][col] = previous[col];
			}
		}
		if (!breakFlag) {
			for (var row in table) {
				if (row == table.length - 1) {
					break;
				}
				if (table[row]["_id"] == null) {
					table[row]["_id"] = undefined;
				}
				targets.push(table[row]);
			}
			$http({
				method : 'PUT',
				url : url,
				data : targets,
			}).
			then(function(data, status, headers, config) {
				varExCategories = data.data;
				updateTable("submitVarExpense");
				showTotals();
			});
		}
	});

	$( "#date" ).datepicker({
		dateFormat: 'yy/mm/dd'
	});

	$(".list-group-item").click(function() {
		console.log("month clicked");
		$(".list-group-item").attr("class", "list-group-item");
		$(this).attr("class", "list-group-item active");
		$("#month").text($(this).attr("id"));
		$("#date").val($("#month").text() + "/01");
		date = $("#date").val();
		month = $("#month").text();
		updateTable("submitVarExpense");
		updateTable("submitFixExpense");
		updateTable("submitRevenue");
		showTotals();
		return false;
	});

};
