var express = require('express');

var router = express.Router();

const BOARD_LISTS_URL = "/1/boards/"+process.env.BOARD_LISTS_ID+"/lists"

const fetch = require('node-fetch');

const Trello = require('node-trello')
const t = new Trello(process.env.TRELLO_API_ID, process.env.TRELLO_SERVER_TOKEN);
var AllLists ;


function getAllCards(lists,listIndex,callback,res)
{
  if(listIndex >= lists.length)
  {
    callback(res)
    return;
  }
  t.get("1/lists/"+lists[listIndex].id+"/cards",function(err,cards){
    if(lists[listIndex].name.includes("[OFFREUR]"))
    {
      res.doneLists.push({cards:cards,name:lists[listIndex].name.replace('[OFFREUR]','')})
    }else{
      res.wishLists.push({name:lists[listIndex].name,cards:cards})
    }
    getAllCards(lists,listIndex+1,callback,res)
  })
}

function getLists(response)
{
  t.get(BOARD_LISTS_URL,function(err,lists) {
      AllLists = lists
      let res = {wishLists :[],doneLists : []}
      if(err) throw err
      getAllCards(lists,0,function(data){response.render('index',data)},res);
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  getLists(res)
});

router.post('/',async function(req,res,next) {

  let properList = AllLists.filter(e => e.name.includes("[OFFREUR]"+req.body.offreur))[0]
  let offreurName = req.body.offreur
  let properListId;
  if(!properList)
  {
    //create a list for this offreur
    let response = await fetch('https://api.trello.com/1/boards/'+process.env.BOARD_LISTS_ID+'/lists?key='+process.env.TRELLO_API_ID+'&token='+process.env.TRELLO_SERVER_TOKEN+'&name=[OFFREUR]'+encodeURI(offreurName), {
      method: 'POST'
    })
    let result = await fetch('https://api.trello.com/1/boards/'+process.env.BOARD_LISTS_ID+'/lists?key='+process.env.TRELLO_API_ID+'&token='+process.env.TRELLO_SERVER_TOKEN,{
        method:'GET'
    })
    let json = await result.json()
    properListId = json.filter(e => e.name=='[OFFREUR]'+offreurName)[0].id
  }else
  {
    properListId = properList.id
  }

  t.put("/1/cards/"+req.body.cardId+"/idList",{value:properListId},function(err,resHere){
    if(err) throw err
    res.redirect('/')
  })
});

module.exports = router;
