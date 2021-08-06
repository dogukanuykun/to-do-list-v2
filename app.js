//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, result) {
    if (result.length === 3) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("items added");
        }
      });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, result) {
      if (!err) {
        result.items.push(item);
        result.save();
        res.redirect("/" + listName);
      }
    });
  }

  // Item.insertOne(item,function(err,result){
  //   if(err) console.log(err);
  //   else{
  //     console.log(result);
  //     res.redirect("/")
  //   }
  // })
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Item deleted!");
        res.redirect("/");
      }
    });
  }else{
    Item.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId }}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName)
      }
    })
  }
});

app.get("/:param", function (req, res) {
  const customListName = _.capitalize(req.params.param) ;

  List.findOne({ name: customListName }, function (err, result) {
    if (!err) {
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        const items = res.render("list", {
          listTitle: customListName,
          newListItems: defaultItems,
        });
      }
    }
  });

  const list = new List({
    name: customListName,
    items: defaultItems,
  });
  list.save();
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
