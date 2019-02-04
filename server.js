//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var sleep = require("sleep");

var fs = require("fs");
var share = require('social-share');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];
var users_info = [];

//game
var openGame = false;
var time = 0;

router.get("/about", function(req, res){
  res.sendFile(__dirname + '/client/about.html');
});

router.get("/facebook-share", function(req,res){
  var url = share('facebook', {
    title: 'test',
    url: 'http://baucua-helloqwert12.c9users.io/'
  });
  res.redirect(url);
});

console.log("start the game");
runGame();
io.on('connection', function (socket) {
  
  console.log("client connected with socket id: " + socket.id);

    //add socket
    sockets.push(socket);

    socket.on('disconnect', function () {
      //remove user
      sockets.splice(sockets.indexOf(socket), 1);
      
      //find the index of user that will be removed
      for(var i=0; i<users_info.length; i++){
        if (users_info[i].socket_id == socket.id){
          //console.log("index of user will be removed: " + i);
          users_info.splice(users_info.indexOf(i),1);
          break;
        }
      }
      
      console.log("one user disconnected");
      console.log("number of users now: " + users_info.length);
      io.emit('user_change', users_info);
     
    });
    
    socket.on('new_user', function(userinfo){
      //add to users_info array
      users_info.push(userinfo);
      console.log("new user join: " + userinfo.name);
      //console.log("index of user " + userinfo.name +" is " + users_info.indexOf(users_info.findIndex(function(element){ return userinfo.name})));
      console.log("number of users now: " + users_info.length);
      //emit to other user that user has been add, send array users_info
      io.emit('user_change', users_info);
    });
    
    socket.on('new_message', function(msginfo){
      //emit to all client new message
      console.log("new message from " + msginfo.name + ": " + msginfo.message);
      io.emit('new_message', msginfo);
    });
    
    socket.on('table_online_change', function(info){
      console.log("update table online: " + info.name + " | " + info.coins);
      //find the index of user that will be removed
      for(var i=0; i<users_info.length; i++){
        if (users_info[i].socket_id == info.socket_id){
          users_info[i].coins = info.coins;
          break;
        }
      }
      io.emit('user_change', users_info);
    });
    
    socket.on('log_test', function(msg){
      console.log("log test: " + msg);
    });
    
    //change page
    socket.on('change_page', function(page_name){
      switch(page_name){
        case "report":
          break;
      }
    });
    
    //received report
    socket.on('report', function(info){
      fs.appendFile('report_info.txt', new Date() + ": " + info + "\n", 'utf8', function(err){
        if (err){
          console.log("error when collecting report: " + err);
          return;
        }
        console.log("Collected report from user successfully: " + info);
      });
    });

  });

// function updateRoster() {
//   async.map(
//     sockets,
//     function (socket, callback) {
//       socket.get('name', callback);
//     },
//     function (err, names) {
//       broadcast('roster', names);
//     }
//   );
// }

// function broadcast(event, data) {
//   sockets.forEach(function (socket) {
//     socket.emit(event, data);
//   });
// }

function runGame(){
        openGame=true;
        time = 15; //test
        setInterval(function(){
          io.emit('tick_time', {
            open_game: openGame,
            time: time
          });
          time--;
    
          if (time < -5){
            //if game is open, then close
            if (openGame){
              showDice();
              openGame = false;
              time = 1;
              //emit open game is false
              io.emit('game_change', false);
            }
            else{
              //handle money for users
              openGame = true;
              time = 15;
              
              //emit open game is true
              io.emit('game_change', true);
              
              //find the user has max coins and min coins
              var i_max = 0;
              var max_name = [], zero_name = [];
              for(var i=0; i<users_info.length; i++){
                if (users_info[i].coins > users_info[i_max].coins){
                  i_max = i;
                }
                if (users_info[i].coins == 0)
                  zero_name.push(users_info[i].name);
              }
              
              for(var j=0; j<users_info.length; j++){
                if (users_info[j].coins == users_info[i_max].coins)
                  max_name.push(users_info[j].name);
              }
              
              console.log("user has max coins: " + max_name);
              console.log("user has zero coins: " + zero_name);
              //noitce all users
              io.emit('new_message', {
                name: max_name + " đang dẫn đầu",
                message: " "
              });
              if (zero_name.length > 0){
                io.emit('new_message', {
                  name: zero_name + " đã táng gia bại sản",
                  message: " "
                });
              }
            }
          }
        },1000);
}


function showDice(){
  var dice_1 =  Math.floor((Math.random() * 6) + 0);
  var dice_2 =  Math.floor((Math.random() * 6) + 0);
  var dice_3 =  Math.floor((Math.random() * 6) + 0);
  console.log("dice 1: " + dice_1);
  console.log("dice 2: " + dice_2);
  console.log("dice 3: " + dice_3);
  io.emit('dice_result',{
    dice_1: dice_1,
    dice_2: dice_2,
    dice_3: dice_3
  });
}


// server.listen(process.env.PORT || 8000, process.env.IP || "0.0.0.0", function(){
//   var addr = server.address();
//   console.log("Chat server listening at", addr.address + ":" + addr.port);
// });

server.listen(process.env.PORT, function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
