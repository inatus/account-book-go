(function(){

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

	var observer = {
		countSync:function () {
			console.log("+++observer.showArguments: ");
        _.each(arguments, function (item, index) {
            console.log("  +++arguments[" + index + "]: " + JSON.stringify(item));
        });
			syncCount++;
			console.log("sync count: " + syncCount);
		}
	};
	_.extend(observer, Backbone.Events);

	var VarExpense = Backbone.Model.extend({
		urlRoot: "/api/account_service/variable_expenses",
		idAttribute: "_id",
		defaults: {
			"date": date,
			"category": "",
			"item": "",
			"price": 0
		}
	});

	var VarExpenseList = Backbone.Collection.extend({
		model: VarExpense,
		url: "/api/account_service/variable_expenses",
		dataType: 'jsonp',
		save: function(){
			Backbone.sync("update", this, {
				success: function(){
					console.log("save successfully");
					updateTable("submitVarExpense");
					showTotals();
				},
				error: function(model, res){
					console.log("error saving :" + res);
				}

			});
		}
	});

	var FixExpense = Backbone.Model.extend({
		urlRoot: "/api/account_service/fixed_expenses",
		idAttribute: "_id",
		defaults: {
			"month": "",
			"item": "",
			"price": 0
		}
	});

	var FixExpenseList = Backbone.Collection.extend({
		model: FixExpense,
		url: "/api/account_service/fixed_expenses",
		save: function(){
			Backbone.sync("update", this, {
				success: function(){
					console.log("save successfully");
					updateTable("submitFixExpense");
					showTotals();
				},
				error: function(){
					console.log("error saving");
				}

			});
		}
	});

	var Revenue = Backbone.Model.extend({
		urlRoot: "/api/account_service/revenues",
		idAttribute: "_id",
		defaults: {
			"month": "",
			"item": "",
			"price": 0
		}
	});

	var RevenueList = Backbone.Collection.extend({
		model: Revenue,
		url: "/api/account_service/revenues",
		save: function(){
			Backbone.sync("update", this, {
				success: function(){
					console.log("save successfully");
					updateTable("submitRevenue");
					showTotals();
				},
				error: function(){
					console.log("error saving");
				}

			});
		}
	});

	var VarExCategory = Backbone.Model.extend({
		urlRoot: "/api/account_service/variable_expense_categories",
		idAttribute: "_id",
	});

	var VarExCategoryList = Backbone.Collection.extend({
		model: VarExCategory,
		url: "/api/account_service/variable_expense_categories"
	});

	var varExCategories = new VarExCategoryList();
	var varExpenses = new VarExpenseList();
	var varExTable;
	var $varExContainer = $("#varExpense");
	var varExHandsontable;

	var fixExpenses = new FixExpenseList();
	var fixExTable;
	var $fixExContainer = $("#fixExpense");
	var fixExHandsontable;

	var revenues = new RevenueList();
	var revenueTable;
	var $revenueContainer = $("#revenue");
	var revenueHandsontable;

	varExCategories.fetch({
		success: function() {
			console.log("Fetch varExCategories: " + JSON.stringify(varExCategories));
		}
	}).pipe(function() {
		return varExpenses.fetch({
			success: function() {
				console.log("Fecth varExList: " + JSON.stringify(varExpenses));
				varExTable = JSON.parse(JSON.stringify(varExpenses.where({date: date})));
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
						source: varExCategories.pluck("category")
					},
					{data: "item"},
					{data: "price",
						type: 'numeric',
						format: '$0,0',
						language: 'ja'}
					]
				});
				varExHandsontable = $varExContainer.handsontable('getInstance');
			}
		});
	}).pipe(function() {
		return fixExpenses.fetch({
			success: function() {
				console.log("Fecth fixExList: " + JSON.stringify(fixExpenses));
				fixExTable = JSON.parse(JSON.stringify(fixExpenses.where({month: month})));
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
			}
		});
	}).done(function() {
		return revenues.fetch({
			success: function() {
				console.log("Fecth revenueList: " + JSON.stringify(revenues));
				revenueTable = JSON.parse(JSON.stringify(revenues.where({month: month})));
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
			}
		});
	});

	function updateTable(element) {
		var updateList = getUpdateList(element);
		updateList.fetch({
			success: function() {
				console.log("Fecth varExCategoryList: " + JSON.stringify(updateList));
				var table = JSON.parse(JSON.stringify(updateList.where(getWhere(element))));
				getHandsontable(element).loadData(table);
			}
		});
	}

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

	function getTarget(element) {
		switch (element) {
			case "submitVarExpense":
				return new VarExpense();
			case "submitFixExpense":
				return new FixExpense();
			case "submitRevenue":
				return new Revenue();
			default:
				return null;
		}
	}

	function getTargetList(element) {
		switch (element) {
			case "submitVarExpense":
				return new VarExpenseList();
			case "submitFixExpense":
				return new FixExpenseList();
			case "submitRevenue":
				return new RevenueList();
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
				return varExpenses;
			case "submitFixExpense":
				return fixExpenses;
			case "submitRevenue":
				return revenues;
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

	function getWhere(element) {
		switch (element) {
			case "submitVarExpense":
				return {date: date};
			case "submitFixExpense":
				return {month: month};
			case "submitRevenue":
				return {month: month};
			default:
				return null;
		}
	}

	$(".submit").click(function () {
		var id = $(this).attr("id");
		var previous = {"category": null, "item": null, "price": null};
		var cols = getCols(id);
		var targets = getTargetList(id);
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
				targets.add(table[row]);
			}
			targets.save(null, {});
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

}());
