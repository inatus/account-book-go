package main

import (
	"code.google.com/p/gorest"
	"fmt"
	"labix.org/v2/mgo"
	"labix.org/v2/mgo/bson"
	"log"
	"net/http"
	"strconv"
	"strings"
)

const (
	MONGO_SERVER  = "localhost"
	MONGO_DB_NAME = "account-book"
	PORT          = "8042"
)

var (
	mgoSession *mgo.Session
)

type VarExpense struct {
	Id       bson.ObjectId `json:"_id" bson:"_id,omitempty"`
	Date     string        `json:"date" bson:"date"`
	Category string        `json:"category" bson:"category"`
	Item     string        `json:"item" bson:"item"`
	Price    int           `json:"price" bson:"price"`
}

type VarExpenseCategory struct {
	Id             bson.ObjectId `json:"_id" bson:"_id,omitempty"`
	Category       string        `json:"category" bson:"category"`
	Classification string        `json:"classification" bson:"classification"`
}

type FixExpense struct {
	Id    bson.ObjectId `json:"_id" bson:"_id,omitempty"`
	Month string        `json:"month" bson:"month"`
	Item  string        `json:"item" bson:"item"`
	Price int           `json:"price" bson:"price"`
}

type Revenue struct {
	Id    bson.ObjectId `json:"_id" bson:"_id,omitempty"`
	Month string        `json:"month" bson:"month"`
	Item  string        `json:"item" bson:"item"`
	Price int           `json:"price" bson:"price"`
}

type MonthTotal struct {
	Month int        `json:"month"`
	Total int           `json:"total"`
}

func main() {
	sess, err := mgo.Dial(MONGO_SERVER)
	if err != nil {
		panic(err)
	}
	defer sess.Close()
	sess.SetSafe(&mgo.Safe{})
	mgoSession = sess

	gorest.RegisterService(new(AccountService))
	http.Handle("/", http.FileServer(http.Dir("web")))
	http.HandleFunc("/input", RedirectHandler)
	http.HandleFunc("/statistics", RedirectHandler)
	http.Handle("/api/", gorest.Handle())
	log.Fatal(http.ListenAndServe(":"+PORT, nil))
}

func RedirectHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/", http.StatusFound)
}

type AccountService struct {
	gorest.RestService `root:"/api/account_service/" consumes:"application/json" produces:"application/json"`

	listVarExpenseCategory gorest.EndPoint `method:"GET" path:"/variable_expense_categories/" output:"[]VarExpenseCategory"`

	listVarExpense       gorest.EndPoint `method:"GET" path:"/variable_expenses/" output:"[]VarExpense"`
	addVarExpense        gorest.EndPoint `method:"POST" path:"/variable_expenses" postdata:"VarExpense"`
	updateVarExpense     gorest.EndPoint `method:"PUT" path:"/variable_expenses/{Id:string}" postdata:"VarExpense"`
	updateVarExpenseList gorest.EndPoint `method:"PUT" path:"/variable_expenses/" postdata:"[]VarExpense"`

	listFixExpense       gorest.EndPoint `method:"GET" path:"/fixed_expenses/" output:"[]FixExpense"`
	addFixExpense        gorest.EndPoint `method:"POST" path:"/fixed_expenses" postdata:"FixExpense"`
	updateFixExpense     gorest.EndPoint `method:"PUT" path:"/fixed_expenses/{Id:string}" postdata:"FixExpense"`
	updateFixExpenseList gorest.EndPoint `method:"PUT" path:"/fixed_expenses/" postdata:"[]FixExpense"`

	listRevenue       gorest.EndPoint `method:"GET" path:"/revenues/" output:"[]Revenue"`
	addRevenue        gorest.EndPoint `method:"POST" path:"/revenues" postdata:"Revenue"`
	updateRevenue     gorest.EndPoint `method:"PUT" path:"/revenues/{Id:string}" postdata:"Revenue"`
	updateRevenueList gorest.EndPoint `method:"PUT" path:"/revenues/" postdata:"[]Revenue"`

	getVarExpenseMonthTotal gorest.EndPoint `method:"GET" path:"/variable_expenses/{Month:string}/total/" output:"int"`
	getFixExpenseMonthTotal gorest.EndPoint `method:"GET" path:"/fixed_expenses/{Month:string}/total/" output:"int"`
	getRevenueMonthTotal    gorest.EndPoint `method:"GET" path:"/revenues/{Month:string}/total/" output:"int"`

	getListVarExpenseYearTotal gorest.EndPoint `method:"GET" path:"/variable_expenses/{Year:string}/totals/" output:"[]MonthTotal"`
	getListFixExpenseYearTotal    gorest.EndPoint `method:"GET" path:"/fixed_expenses/{Year:string}/totals/" output:"[]MonthTotal"`
	getListRevenueYearTotal    gorest.EndPoint `method:"GET" path:"/revenues/{Year:string}/totals/" output:"[]MonthTotal"`
}

func (serv AccountService) ListVarExpenseCategory() []VarExpenseCategory {
	collection := mgoSession.DB(MONGO_DB_NAME).C("category")

	var categories []VarExpenseCategory

	log.Println("start")

	if err := collection.Find(bson.M{}).All(&categories); err != nil {
		log.Fatal("Can't insert document: %v\n", err)
	}

	log.Println(categories)

	return categories
}

func getDataList(input string, output interface{}) {
	collection := mgoSession.DB(MONGO_DB_NAME).C(input)

	log.Println("Retrieve list from " + input + ": ")

	if err := collection.Find(bson.M{}).All(output); err != nil {
		log.Fatal("Can't retrieve list: %v\n", err)
	}

	log.Println(output)
}

func addData(input string, data bson.M) {
	collection := mgoSession.DB(MONGO_DB_NAME).C(input)

	log.Println("Insert " + input + ": ")

	if err := collection.Insert(data); err != nil {
		log.Fatal("Can't insert: %v\n", err)
	}
}

func updateData(input string, id bson.ObjectId, data bson.M) {
	collection := mgoSession.DB(MONGO_DB_NAME).C(input)

	log.Println("Update " + input + ", id " + id.String() + ": ")

	colQuerier := bson.M{"_id": id}
	change := bson.M{"$set": data}
	if err := collection.Update(colQuerier, change); err != nil {
		log.Fatal("Can't update : %v\n", err)
	}
}

func (serv AccountService) ListVarExpense() []VarExpense {
	var varExpenses []VarExpense
	getDataList("varExpense", &varExpenses)
	return varExpenses
}

func (serv AccountService) AddVarExpense(PostData VarExpense) {
	addData("varExpense", bson.M{"date": PostData.Date, "category": PostData.Category, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateVarExpense(PostData VarExpense, Id string) {
	updateData("varExpense", PostData.Id, bson.M{"date": PostData.Date, "category": PostData.Category, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateVarExpenseList(PostData []VarExpense) {
	for _, element := range PostData {
		if element.Id == "" {
			addData("varExpense", bson.M{"date": element.Date, "category": element.Category, "item": element.Item, "price": element.Price})
		} else {
			updateData("varExpense", element.Id, bson.M{"date": element.Date, "category": element.Category, "item": element.Item, "price": element.Price})
		}
	}
	// TODO: Client side should be able to get the JSON array
	serv.ResponseBuilder().Write([]byte("{}"))
}

func (serv AccountService) ListFixExpense() []FixExpense {
	var fixExpenses []FixExpense
	getDataList("fixExpense", &fixExpenses)
	return fixExpenses
}

func (serv AccountService) AddFixExpense(PostData FixExpense) {
	addData("fixExpense", bson.M{"month": PostData.Month, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateFixExpense(PostData FixExpense, Id string) {
	updateData("fixExpense", PostData.Id, bson.M{"month": PostData.Month, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateFixExpenseList(PostData []FixExpense) {
	for _, element := range PostData {
		if element.Id == "" {
			addData("fixExpense", bson.M{"month": element.Month, "item": element.Item, "price": element.Price})
		} else {
			updateData("fixExpense", element.Id, bson.M{"month": element.Month, "item": element.Item, "price": element.Price})
		}
	}
	// TODO: Client side should be able to get the JSON array
	serv.ResponseBuilder().Write([]byte("{}"))
}

func (serv AccountService) ListRevenue() []Revenue {
	var revenues []Revenue
	getDataList("revenue", &revenues)
	return revenues
}

func (serv AccountService) AddRevenue(PostData Revenue) {
	addData("revenue", bson.M{"month": PostData.Month, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateRevenue(PostData Revenue, Id string) {
	updateData("revenue", PostData.Id, bson.M{"month": PostData.Month, "item": PostData.Item, "price": PostData.Price})
}

func (serv AccountService) UpdateRevenueList(PostData []Revenue) {
	for _, element := range PostData {
		if element.Id == "" {
			addData("revenue", bson.M{"month": element.Month, "item": element.Item, "price": element.Price})
		} else {
			updateData("revenue", element.Id, bson.M{"month": element.Month, "item": element.Item, "price": element.Price})
		}
	}
	// TODO: Client side should be able to get the JSON array
	serv.ResponseBuilder().Write([]byte("{}"))
}

func getTotal(input string, query bson.M) int {
	collection := mgoSession.DB(MONGO_DB_NAME).C(input)

	var data map[string]int
	iter := collection.Find(query).Select(bson.M{"price": 1}).Iter()
	total := 0
	for iter.Next(&data) {
		total += data["price"]
	}
	if err := iter.Close(); err != nil {
		log.Fatal("Can't close iteration: %v\n", err)
	}

	log.Println(input + " total: " + strconv.Itoa(total))

	return total
}

func (serv AccountService) GetVarExpenseMonthTotal(Month string) int {
	regex := new(bson.RegEx)
	regex.Pattern = "^" + strings.Replace(Month, "-", "/", -1)

	return getTotal("varExpense", bson.M{"date": regex})
}

func (serv AccountService) GetFixExpenseMonthTotal(Month string) int {
	return getTotal("fixExpense", bson.M{"month": strings.Replace(Month, "-", "/", -1)})
}

func (serv AccountService) GetRevenueMonthTotal(Month string) int {
	return getTotal("revenue", bson.M{"month": strings.Replace(Month, "-", "/", -1)})
}

func (serv AccountService) GetListVarExpenseYearTotal(Year string) ([]MonthTotal) {
	result := []MonthTotal{}
	regex := new(bson.RegEx)
	for month := 1; month <= 12; month++ {
		regex.Pattern = "^" + Year + "/" + fmt.Sprintf("%02d", month)
		monthTotal := MonthTotal{month, 0}
		monthTotal.Total = getTotal("varExpense", bson.M{"date": regex})
		result = append(result, monthTotal)
	}

	return result
}

func (serv AccountService) GetListFixExpenseYearTotal(Year string) ([]MonthTotal) {
	result := []MonthTotal{}
	for month := 1; month <= 12; month++ {
		monthTotal := MonthTotal{month, 0}
		monthTotal.Total = getTotal("fixExpense", bson.M{"month": Year + "/" + fmt.Sprintf("%02d", month)})
		result = append(result, monthTotal)
	}
	return result
}

func (serv AccountService) GetListRevenueYearTotal(Year string) ([]MonthTotal) {
	result := []MonthTotal{}
	for month := 1; month <= 12; month++ {
		monthTotal := MonthTotal{month, 0}
		monthTotal.Total = getTotal("revenue", bson.M{"month": Year + "/" + fmt.Sprintf("%02d", month)})
		result = append(result, monthTotal)
	}
	return result
}
