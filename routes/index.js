var express = require('express');

var router = express.Router();
const CONFIG = require('../config.json')


const BOARD_LISTS_URL = "/1/boards/"+CONFIG.BOARD_LISTS_ID+"/lists"

const Trello = require('node-trello')
const t = new Trello(CONFIG.TRELLO_API_ID, CONFIG.TRELLO_SERVER_TOKEN);

function getAllCards(lists,listIndex,callback,res)
{
  if(listIndex >= lists.length)
  {
    callback(res)
    return;
  }
  t.get("1/lists/"+lists[listIndex].id+"/cards",function(err,cards){
    if(lists[listIndex].name.includes(CONFIG.PICKED_LIST_NAME))
    {
      res.doneList = cards
    }else{
      res.wishLists.push({name:lists[listIndex].name,cards:cards})
    }
    getAllCards(lists,listIndex+1,callback,res)
  })
}

function getLists(response)
{
  t.get(BOARD_LISTS_URL,function(err,lists){
      let res = {wishLists :[],doneList : {}}
      if(err) throw err
      getAllCards(lists,0,function(data){response.render('index',data)},res);

  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  getLists(res)
});

function getDoneListId(callback)
{
  t.get(BOARD_LISTS_URL,function(err,lists){
    if(err) throw err
    for(let i =0;i < lists.length;i++)
    {
      if(lists[i].name.includes(CONFIG.PICKED_LIST_NAME))
      {
        callback(lists[i].id)
        return
      }
    }
    throw "Done list not found"
  })
}

router.post('/',function(req,response,next){
  console.log(req.body.cardId);
  getDoneListId(function(doneListId){
    t.put("/1/cards/"+req.body.cardId+"/idList",{value:doneListId},function(err,res){
      if(err) throw err
      response.redirect('/')
    })
  })
});

module.exports = router;
