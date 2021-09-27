const http = require("http");
const querystring = require("querystring");
const discord = require("discord.js");
require("discord-reply");//必ずこの位置に追加
const client = new discord.Client();

// デバッグ時true
const DEBUG_MODE = false;

http
  .createServer(function(req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function(chunk) {
        data += chunk;
      });
      req.on("end", function() {
        if (!data) {
          res.end("No post data");
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Discord Bot is active now\n");
    }
  })
  .listen(3000);

client.on("ready", message => {
  console.log("Bot準備完了～");
  client.user.setPresence({ activity: { name: "監視中" }, status: "online" });
});

client.on("message", message => {
  // 自分自身には反応しない
  if (message.author.id == client.user.id) {
    return;
  }

  //===================================
  //debug modeのときはdebug用チャンネル以外は「メンテ中」と表示して処理しない(未実装)
//  const DEBUG_MODE = true;
  if (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH)  return;  //for debug
//  if (DEBUG_MODE && !message.author.bot && message.channel.id != process.env.DISCORD_BOT_TEST_CH) {
//    var text = '\n\nごめんなさい。\nメンテナンス中です。\n'
//                             + '\n\n後から試してね♡';
//    sendReply(message, text);
//    return;  //for debug
//  }
  //===================================

  // gvg出欠確認にリアクションを付ける
  // author.idはwebhookの最初の数字18桁
  if (message.author.id == process.env.DISCORD_BOT_ID01 ||
      message.author.id == process.env.DISCORD_BOT_ID02) {
    console.log(message.author.id + ":" + message.author.username);
    message.react("⭕");
    message.react("❌");
    message.react("❓");
    message.react("🎤");
    message.react("👂");
    message.react("😭");
    return;
  }
  // CPbotに反応する
  // author.idはwebhookの最初の数字18桁
  if (message.author.id == process.env.DISCORD_BOT_CP) {
    console.log(message.author.id + ":" + message.author.username);
    message.react("🤘");　//react確認。ここで!ho reset自動リセットする。
    console.log('Webhook CP RESET');
    let text = "@everyone" + "\n戦闘力の報告をお願いします！\n" 
             + "【入力方法】!cp 戦闘力 ジョブ\n （例）`!cp 1234567 パラ`　という感じで入力してください。\n\n" 
             + "　※!cpと区切りのスペースは半角・全角OKです。\n"
             + "\n-----------------------------------------";
    console.log("ch:" + message.channel.id + "  me:" + message.id);
    sendMsgAndLog('cp', message.channel.id, text);
    clearAllData('cp');
    
    return;
  }

  // 報奨botに反応する
  // author.idはwebhookの最初の数字18桁
  if (message.author.id == process.env.DISCORD_BOT_HO) {
    console.log(message.author.id + ":" + message.author.username);
    message.react("🤘");　//react確認。ここで!ho reset自動リセットする。
    console.log('Webhook HO RESET');
    let text = "@everyone" + "\n希望報奨の報告をお願いします！\n" 
             + "【入力方法】!ho 希望報奨1 2 3\n （例）`!ho rsp 黄粉 黄粉` (スペース、カンマで区切って！)" 
             + "\n (全角でも半角でもOKです！)" 
             + "\n-----------------------------------------";
    console.log("HO CH:" + message.channel.id + "  HO ME:" + message.id);
    sendMsgAndLog('ho', message.channel.id, text);
    clearAllData('ho');
    return;
  }
  
  // メンションで呼ばれた時は使用方法を表示 @here @everyone は無視する　
  if    (message.isMemberMentioned(client.user) 
    && !(message.content.includes("@here") || message.content.includes("@everyone"))) {
    console.log(message.channel.name);
    let arr = ["ん？呼んだ？", "はーい♡", ". . .", "起きてるよ", "うるせぇな"];
    var random = Math.floor(Math.random() * arr.length);
    var result = arr[random] + '\n\n【戦闘力報告関連】 `!cp`'
                             + '\n\n【報奨希望関連】 `!ho`'
                             + '\n\n【タイマー関連】 `!timer`'
                             + '\n\n【おみくじだよ】 `!omikuji`';
    sendReply(message, result);
    return;
  }
  //===================================
  //debug用チャンネル以外は処理しない
  //if (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH) return;  //for debug
  //CP報告用チャンネル以外は処理しない
  //if (!DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_CP_CH) return;  //for release
  //===================================
    
  //コマンド関連
  const prefix = "!";
  const prefixes= ['!', '！'];    //全角対応　ほかに追加してもよいがprefixも含めて文字数は統一する
//  if (message.content.startsWith(prefix)){
  if (prefixes.some(prefix=> message.content.startsWith(prefix))){
    const args = message.content.slice(prefix.length).trim().split(/[ ,.　、，．]/);
    const cmd = args.shift().toLowerCase();
    console.log ( "cmd:" + cmd + "  arg:" + args + "   content:" + message.content);

    if (cmd === 'cp' || cmd === 'ｃｐ') {
        const cpargs = message.content.slice(prefix.length).trim().split(/ |　/);
        const cpcmd = cpargs.shift().toLowerCase();
        cpMain(message, cpargs);
        return;
    }
    if (cmd === 'ho' || cmd === 'ｈｏ' || cmd === 'ほ'  || cmd === 'ホ') {
        hoMain(message, args);
        return;
    }
    if (cmd === 'timer' || cmd === 'ｔｉｍｅｒ') {
        timerMain(message, args);
        return;
    }
    if (cmd === 'omikuji' || cmd === 'ｏｊｉｋｕｊｉ' || cmd === 'おみくじ'  || cmd === 'オミクジ') {
        omikujiMain(message, args);
        return;
    }
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
//===========================================================================
//
//    cp関連
//
//===========================================================================
function cpMain(message, args) {
  //Usage  ※HelpはどのchでもOK
  if (args[0] === 'help' || args[0] === undefined) {
    console.log('HELP');
    let text = "\n【報告用】!cp 戦闘力 ジョブ\n"
    + "　　　  　`!cp 1234567 パラ`　という感じで入力してください。\n\n"
    + "　※!cpと区切りのスペースは半角・全角OKです。\n"
    + "　　数字はカンマで区切ってもOK。ただし集計結果はカンマなしです。\n\n"
    + "　※何度でも入力可能です。間違えたら再度入力してください。\n"
    + "　　後から入力したもので上書きします。\n\n\n"
    + "【設定用】`!cp reset`：現在のチャンネルに報告用のメッセージを作成します。\n\n"
    + "　※集計する人が行いますので通常は使いません。\n"
    + "　※このコマンドが入力されるとメンションが行きますので早めに報告しましょう。\n";
    sendMsg(message.channel.id, text);
    return;
  }
  //チャンネルチェック
  if ((!DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_CP_CH)   ||  //for release    
       (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH)) {  //for debug
    console.log('CH ERROR');
    let text = "ここじゃダメ♡"
    + "\n【戦闘力報告用】で書いてね♡";
    sendMsg(message.channel.id, text);
    return;
  }
  // reset データを初期化して報告用のメッセージ送信
  if (args[0] === 'reset' ){
    console.log('RESET');
    let text = "@everyone" + "\n戦闘力の報告をお願いします！\n" 
             + "【入力方法】!cp 戦闘力 ジョブ\n （例）`!cp 1234567 パラ`　という感じで入力してください。\n\n" 
             + "　※!cpと区切りのスペースは半角・全角OKです。\n"
             + "\n-----------------------------------------";
    console.log("ch:" + message.channel.id + "  me:" + message.id);
    sendMsgAndLog('cp', message.channel.id, text);
    clearAllData('cp');
    return;
  }

  // 報告時の処理
  if (args[0] !== undefined){
    
    //数字チェック
    //カンマを取り除く
    let cCP = checkCP(args[0].replace(/[,、，]/g, ''), message);
    if (cCP === false) return;
    
    //設定・データの読み込み
    var fs = require('fs');
    var jsonCpConfig = JSON.parse(fs.readFileSync('./config.json','utf8'));
    var result = {};
    var jsonMemData = JSON.parse(fs.readFileSync('./cpdata.json','utf8'));
    var result = {};

    //投稿者が既に報告済みか判定      
    let passIndex = jsonMemData.members.findIndex(function(item){
                                   return item.id == message.author.id;
                                   });
    console.log('index:' + passIndex);
    //該当IDがなければ追加、あれば更新
    if (passIndex === -1) {
      let new_data = {id: message.author.id,
                      name: message.author.tag,
                      cp: cCP,
                      job: args[1]
                     };
      jsonMemData.members.push(new_data);
      console.log('newdata: ' + JSON.stringify(new_data));
    } else {
      console.log('else: ' + passIndex);
      jsonMemData.members[passIndex].name = message.author.tag;
      jsonMemData.members[passIndex].cp = cCP;
      jsonMemData.members[passIndex].job = args[1];
    }
    console.log('memdata: ' + JSON.stringify(jsonMemData))
    fs.writeFileSync('cpdata.json', JSON.stringify(jsonMemData),"utf8");

    //報告による投稿はメンションを付けない
    let text = "\n戦闘力の報告をお願いします！\n" 
       + "\n-----------------------------------------";

    jsonMemData.members.forEach(function(item,index){
                if (index !== 0){
                    text += '\n"' + item.name + '", ' + item.cp + ', "' + item.job + '"';
                } 
          });
    text += "\n-----------------------------------------\n"
       + "【入力方法】!cp 戦闘力 ジョブ\n （例）`!cp 1234567 パラ`\n"
       + "　※!cpと区切りのスペースは半角・全角OKです。\n";
    console.log('text:' + text);
    console.log(jsonCpConfig.channel, jsonCpConfig.message, JSON.stringify(jsonCpConfig));
    //元の投稿を編集するパターン
    //client.channels.get(jsonCpConfig.channel).fetchMessage(jsonCpConfig.message).then(message => message.edit(text));
    
    
    let oldchannel = jsonCpConfig.channel;
    let oldmessage = jsonCpConfig.message;
    //報告結果を新規投稿する
    sendMsgAndLog('cp', message.channel.id, text);
    //旧データを削除する
    client.channels.get(oldchannel).fetchMessage(oldmessage).then(message => message.delete());
    return;
  }
}

//===========================================================================
//
//報奨関連
//
//===========================================================================
function hoMain(message, args) {
  //Usage  ※HelpはどのchでもOK
  if (args[0] === 'help' || args[0] === undefined) {
    console.log('HO HELP');
    let text = "\n【報告用】!ho 希望報奨1 2 3\n"
    + "　　　  　【よい例】\n"
    + "　　　  　`!ho rsp 黄粉 青粉`\n"
    + "　　　  　`!ho RSP、装飾、装飾`\n"
    + "　　　  　`!ho 青粉×3`\n"
    + "　　　  　`!ho 装飾箱×2 RSP`\n"
    + "　　　  　【わるい例】\n"
    + "　　　  　`!ho RSP装飾箱装飾箱` \n"
    + "　　　  　区切ってください\n"
    + "　　　  　`!ho 装飾箱装飾箱、R SP`\n" 
    + "　　　  　途中にスペースが...\n"
    + "　　　  　`!ho 武技の書をお願い致します`\n" 
    + "　　　  　melody bot に礼儀は不要です\n\n"
    + "　※半角でも全角でもOKです。\n"
    + "　※区切りのスペースはカンマでもOKです。\n"
    + "　※何度でも入力可能です。間違えたら再度入力してください。\n"
    + "　　後から入力したもので上書きします。\n\n\n"
    + "【設定用】`!ho reset`：現在のチャンネルに報告用のメッセージを作成します。\n\n"
    + "　※自動で行いますので通常は使いません。\n"
    + "　※このコマンドが入力されるとメンションが行きますので早めに報告しましょう。\n";
    sendMsg(message.channel.id, text);
    return;
  }
  //チャンネルチェック
  if ((!DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_HO_CH)   ||  //for release    
       (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH)) {  //for debug
    console.log('HO CH ERROR');
    let text = "ここじゃなーい！"
    + "\n【報奨希望】で書いてください♡";
    sendMsg(message.channel.id, text);
    return;
  }
  // reset データを初期化して報告用のメッセージ送信
  if (args[0] === 'reset' ){
    console.log('HO RESET');
    let text = "@everyone" + "\n希望報奨の報告をお願いします！\n" 
             + "【入力方法】!ho 希望報奨1 2 3\n （例）`!ho rsp 黄粉 黄粉` (スペース、カンマで区切って！)" 
             + "\n (全角でも半角でもOKです！)" 
             + "\n-----------------------------------------";
    console.log("HO CH:" + message.channel.id + "  HO ME:" + message.id);
    sendMsgAndLog('ho', message.channel.id, text);
    clearAllData('ho');
    return;
  }

  // 報告時の処理
  if (args[0] !== undefined){
    //設定・データの読み込み
    var fs = require('fs');
    var jsonHoConfig = JSON.parse(fs.readFileSync('./hoconf.json','utf8'));
    var result = {};
    var jsonMemData = JSON.parse(fs.readFileSync('./hodata.json','utf8'));
    var result = {};

    console.log('debug:' + message.author.tag);

    //投稿者が既に報告済みか判定      
    let passIndex = jsonMemData.members.findIndex(function(item){
                                   return item.id == message.author.id;
                                   });
    console.log('index:' + passIndex);
    let cargs = checkArgs(args);
    //該当IDがなければ追加、あれば更新
    if (passIndex === -1) {
      let new_data = {id: message.author.id,
                      name: message.author.tag,
                      h1: cargs[0],
                      h2: cargs[1],
                      h3: cargs[2]
                     };
      jsonMemData.members.push(new_data);
      console.log('newdata: ' + JSON.stringify(new_data));
    } else {
      console.log('else: ' + passIndex);
      jsonMemData.members[passIndex].name = message.author.tag;
      jsonMemData.members[passIndex].h1 = cargs[0];
      jsonMemData.members[passIndex].h2 = cargs[1];
      jsonMemData.members[passIndex].h3 = cargs[2];
    }
    console.log('memdata: ' + JSON.stringify(jsonMemData))
    fs.writeFileSync('hodata.json', JSON.stringify(jsonMemData),"utf8");

    //報告による投稿はメンションを付けない
    let text = "\n希望報奨の報告をお願いします！\n" 
       + "【入力方法】!ho 希望報奨1 2 3\n （例）`!ho rsp 黄粉 黄粉` (スペースかカンマで区切って！)" 
       + "\n-----------------------------------------";

    jsonMemData.members.forEach(function(item,index){
                if (index !== 0){
                    text += '\n"' + item.name + '", "' + item.h1 + '", "' + item.h2 + '", "' + item.h3 + '"';
                } 
          });
    text += "\n-----------------------------------------\n"
       + "【入力方法】!ho 希望報奨1 2 3\n （例）`!ho rsp 黄粉 黄粉` (スペースかカンマで区切って！)"
       + "\n (全角でも半角でもOKです！)" ;
    console.log('text:' + text);
    console.log(jsonHoConfig.channel, jsonHoConfig.message, JSON.stringify(jsonHoConfig));
    //元の投稿を編集するパターン
    //client.channels.get(jsonHoConfig.channel).fetchMessage(jsonHoConfig.message).then(message => message.edit(text));
    let oldchannel = jsonHoConfig.channel;
    let oldmessage = jsonHoConfig.message;
    //報告結果を新規投稿する
    sendMsgAndLog('ho' ,message.channel.id, text);

    //前回の報告結果を削除する
    client.channels.get(oldchannel).fetchMessage(oldmessage).then(message => message.delete());
    return;
  }
}

//===========================================================================
//
//タイマー関連
//
//===========================================================================
function timerMain(message, args) {
  //Usage  ※HelpはどのchでもOK
  if (args[0] === 'help' || args[0] === undefined) {
    console.log('TIMER HELP');
    let text = "\n【時間の設定】!timer 1～60（分）\n\n"
    + "【例】`!timer 60`\n"
    + "　※時間が来たらメンション付きで通知します。\n"
    + "　※半角でも全角でもOKです。\n"
    + "　※区切りのスペースはカンマでもOKです。\n";
    sendMsg(message.channel.id, text);
    return;
  }
  //チャンネルチェック　debugモードはテストチャンネルのみ。リリース後はどこでも使用可
  if (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH) {  //for debug
    console.log('Timer CH ERROR');
    let text = "ここじゃなーい！"
    + "\n【テスト用チャンネル】で書いてください♡";
    sendMsg(message.channel.id, text);
    return;
  }

  // Timerセットの処理
  if (args[0] !== undefined){
    //数字チェック　カンマを取り除く
    let cTimer = checkTimer(args[0].replace(/[,、，]/g, ''), message);
    if (cTimer === false) return;
    //正常に受け付けたらリアクション
    message.react("👌");
    setTimeout(function () {
      let arr = ['\n' + args[0] + "分経ったよ！", 
                 '\nもう' + args[0] + "分かぁ🥺あっという間だね♡", 
                 '\n' + args[0] + "分経過！準備はできてるか？", 
                 '\n' + args[0] + "分　⏰", 
                 "おい、時間だ！"];
      let weight = [5, 1, 5, 5, 2];
      lotteryByWeight(message, arr, weight);
//      var random = Math.floor(Math.random() * arr.length);
//      var text = arr[random];
//      sendReply(message, text);
    }, 1000 * 60 * args[0])    
    
    return;
  }
}

//===========================================================================
//
//おみくじ関連
//
//===========================================================================
function omikujiMain(message, args) {
  //Usage  ※HelpはどのchでもOK
  if (args[0] === 'help') {
    console.log('OMIKUJI HELP');
    let text = "\n【これだけ】!omikuji\n\n"
    + "　※半角でも全角でもOKです。\n";
    sendMsg(message.channel.id, text);
    return;
  }
  //チャンネルチェック　debugモードはテストチャンネルのみ。リリース後はどこでも使用可
  if (DEBUG_MODE && message.channel.id != process.env.DISCORD_BOT_TEST_CH) {  //for debug
    console.log('Timer CH ERROR');
    let text = "ここじゃなーい！"
    + "\n【テスト用チャンネル】で書いてください♡";
    sendMsg(message.channel.id, text);
    return;
  }

  let arr = ['\n' + 'おめでとう㊗️　大吉です！', 
             '\n吉', '\n中吉', '\n小吉', '\n末吉', '\n凶', 
             '\n大凶😵‍💫　やっぱり君が引いたか...', 
             '\nはずれ😱　運勢の前に運がないみたいだね。'];
  let weight = [1, 5, 10, 10, 10, 10, 5, 5];
  lotteryByWeight(message, arr, weight);

  return;
}


function sendReply(message, text) {
  message
    .reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option = {}) {
  client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("sendMsg  CH:" + channelId + " メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

async function sendMsgAndLog(kind, channelId, text, option = {}) {
  let sent = await client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("sendMsgAndLog  CH:" + channelId + " メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
  let id = sent.id;
  writeConfig(kind, channelId, id);
}

function writeConfig(kind, channelId, messageId){
  const fs = require('fs');
  // cp の場合
  let data = {channel: channelId,message: messageId};
  let fname = 'config.json';
  // ho の場合
  if (kind === 'ho') {
    fname = 'hoconf.json';
  }
  console.log('writeConfig ' + kind + ':' + JSON.stringify(data));
  fs.writeFileSync(fname, JSON.stringify(data),"utf8");
}


function clearAllData(kind){
  const fs = require('fs');

  //全データ削除のため[0]はダミーデータとする
  // cp の場合
  let data = {"members": [{id: "000000000000000000", name: "No Name", cp: 1234567, job: "para"}]};
  let fname = 'cpdata.json';
  // ho の場合
  if (kind === 'ho') {
    data = {"members": [{"id": "000000000000000000", "name":"No Name", "h1":"RSP", "h2":"RSP", "h3":"RSP"}]};
    fname = 'hodata.json';
  }
  console.log('clearAllData ' + kind + ":" + JSON.stringify(data));
  fs.writeFileSync(fname, JSON.stringify(data),"utf8");
}

function checkArgs(args){
  //1つ目のチェック
  let array = args[0].split(/[xXｘＸ×]/);
  //console.log("***********************************")
  //console.log(array[0] + ":" + array[1] + " length:" + array.length);
  if (array.length === 2) {
    switch (array[1]){
      case 3:
      case '3':
      case "３":
        array[2] = array[0];
        array[1] = array[0];
        break;
      case 2:
      case '2':
      case "２":
        array[2] = args[1];
        array[1] = array[0];
        break;
      default:
        array = args;
    }
  console.log("checkArgs1:" + array[0] + ":" + array[1] + ":" + array[2]);
  return array;
  }
  //2つ目のチェック
  if(args.length === 1) return args;
  array = args[1].split(/[xXｘＸ×]/);
  //console.log("**222222222222222222222222222222**")
  //console.log(array[0] + ":" + array[1] + " length:" + array.length);
  if (array.length === 2) {
    switch (array[1]){
      case 2:
      case '2':
      case "２":
      case 3:      // 2番目のx3はx2の間違いとみなす
      case '3':
      case "３":
        array[2] = array[0];
        array[1] = array[0];
        array[0] = args[0];
        break;
      default:
        array = args;
    }
  console.log("checkArgs2:" + array[0] + ":" + array[1] + ":" + array[2]);
  return array;
  }
  return args;
}

//cpのチェック
function checkCP(val, message) {
  let ret = hankaku2Zenkaku(val);
  if (isNumber(ret) === false){
    var text = '\n' + ret + '???\n\nごめんなさい。数字で入力してね♡';
    sendReply(message, text);
    return false;
  }
  return ret;
}

// Timerのチェック
function checkTimer(val, message) {
  let ret = hankaku2Zenkaku(val);
  if (isNumber(ret) === false){
    var text = '\n' + ret + '???\n\nごめんなさい。数字で入力してね♡';
    sendReply(message, text);
    return false;
  } else if (ret > 60) {
    var text = '\n' + ret + '分っ???\n\nごめんね。60分までしか数えられないの♡';
    sendReply(message, text);
    return false;
  } else if (ret == 0) {
    var text = '\n' + ret + '分っ???\n\nもう経ってるよ😤';
    sendReply(message, text);
    return false;
  }
  return ret;
}

// 0以上の整数のみ
function isNumber(val){
  var regexp = new RegExp(/^[0-9]+(\.[0-9]+)?$/);
  return regexp.test(val);
}

// 全角を半角にする
function hankaku2Zenkaku(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

// ウェイトありの乱数リプライ
function lotteryByWeight(message, arr, weight){
  let totalWeight = 0;
  for (var i = 0; i < weight.length; i++){
    totalWeight += weight[i];
  }
  let random = Math.floor(Math.random() * totalWeight);
  for (var i = 0; i < weight.length; i++){
    if (random < weight[i]){
      sendReply(message, arr[i]);
      return;
    }else{
      random -= weight[i];
    }
  }
  console.log("lottery error");
}
