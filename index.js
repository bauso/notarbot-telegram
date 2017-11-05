const Telegraf = require('telegraf')
const OpenTimestamps = require('javascript-opentimestamps');

const utils = require('./utils.js');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => {
    console.log('started:', ctx.from.id)
    return ctx.reply('Welcome!')
})
bot.command('help', (ctx) => ctx.reply('Try send a file!'))
bot.on('document', function (ctx){ console.log(ctx.update.message.document); 
    ctx.reply('ok ...wait a moment for ots receipt...')
    //ctx.reply(ctx.update.message.document)
    console.log(ctx);
    console.log(ctx.tg);
    ctx.tg.getFile(ctx.update.message.document.file_id).then(function(file){
        console.log(file)
        let url = `${ctx.tg.options.apiRoot}/file/bot${ctx.tg.token}/${file.file_path}`;
        utils.download(url, "files/"+ctx.update.message.document.file_name, function(err){
            if (err!=undefined){
                console.log(err)
            } else {
                //OTS stuff 
		        fs.readFile('files/'+ctx.update.message.document.file_name, (err, fileToStamp) => {
                    const detached = OpenTimestamps.DetachedTimestampFile.fromBytes(new OpenTimestamps.Ops.OpSHA256(), fileToStamp);
    				OpenTimestamps.stamp(detached).then(() => {
        			    // get the info
        			    const infoResult = OpenTimestamps.info(detached);
        			    console.log(infoResult);
                        ctx.replyWithMarkdown("\n```\n"+infoResult+"\n```");

       			        // save the ots file
       			        const octx = new OpenTimestamps.Context.StreamSerialization();
       			        detached.serialize(octx);
       			        const buffer = new Buffer(octx.getOutput());

     			        const otsFilename = ctx.update.message.document.file_name + '.ots';
                        fs.writeFile(otsFilename, buffer, 'binary', err => {
                            if (err) {
                                return console.log(err);
                            }
                            console.log('The timestamp proof \'' + otsFilename + '\' has been created!');
                            console.log(otsFilename);
                            ctx.replyWithDocument({
                               source: otsFilename,
                               caption:'receipt ots'
                            });
                            console.log(buffer);
                        });
                    })
                })
            }                
         })
    })
})

bot.startPolling()
