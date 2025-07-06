import fs from "fs";
import { dir } from "console";
import { randomInt } from "crypto";
import TelegramBot from "node-telegram-bot-api";
import { text } from "stream/consumers";

import { Bank } from "./bank";
const bank = new Bank();
bank.init();

const token: string = fs.readFileSync("botToken.txt", "utf8").trim();
const admins = fs.readFileSync("admins.txt", "utf-8").split("\n");

const bot = new TelegramBot(token, {polling: true});

import { GameLabyrinth } from "./labyrinth";
import { callbackify } from "util";
const gameLabyrinth = new GameLabyrinth();

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userBalance = await bank.getBalance(chatId);

    await bot.sendMessage(chatId, `You started the bot!\n*--- MAIN MENU ---*\nBalance: *${userBalance}* 💠`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {text:"Profile", callback_data:"profile"},
                ],
                [ 
                    {text:"Choose a game:", callback_data:"none"},
                ], 
                [ 
                    {text:"Labyrinth", callback_data:"game_labyrinth"}, 
                    {text:"Gambling", callback_data:"game_gambling"},
                ],
                [
                    {text:"Stop", callback_data:"stop_bot"},
                ],
            ],
        }
   });
}); 

bot.onText(/\/setBalance (.+)/, async (msg, match: any) => {
    const chatId = msg.chat.id;
    if (!(admins.includes(chatId.toString()))) 
        return await bot.sendMessage(chatId, "You are not allowed to use this command!");
    const resp = match[1];

    if (!(+resp)) await bot.sendMessage(chatId, "Must be a number!");
    else {
        await bank.setBalance(chatId, resp);
        await bot.sendMessage(chatId, `Balance set successfully!`);
    }
});

bot.onText(/\/clear/, async (msg) => {
    for (let i=0; i<101; ++i) {
        await bot.deleteMessage(msg.chat.id, msg.message_id - i).catch(er=>{return});
    }
});

bot.on("callback_query", async (query: any) => {
    await bot.answerCallbackQuery(query.id);

    const chatId = query.message.chat.id;
    const data = query.data;
    const userBalance = await bank.getBalance(chatId);

    if (data === "main_menu") {
        await bot.editMessageText(`*--- MAIN MENU ---*\nBalance: *${userBalance}* 💠`, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {text:"Profile", callback_data:"profile"},
                    ],
                    [ 
                        {text:"Choose a game:", callback_data:"none"},
                    ], 
                    [ 
                        {text:"Labyrinth", callback_data:"game_labyrinth"}, 
                        {text:"Gambling", callback_data:"game_gambling"},
                    ],
                    [
                        {text:"Stop", callback_data:"stop_bot"},
                    ],
                ],
            }
        });
        return;
    }

    if (data === "deposit") {
        if (+bank.getBalance(chatId))
            bank.changeBalance(chatId, 100);
        else bank.setBalance(chatId, 100); 
        bot.editMessageText(`Balance changed successfully!`, {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{text:"OK", callback_data:"main_menu"}]
                ]
            }
        })
        return;
    }

    if (data === "game_labyrinth") {
        gameLabyrinth.StartGame(query.message.chat.id, query.message.message_id, bot, bank);
        return;
    }

    if (data.startsWith("laby_")) {
        gameLabyrinth.gamePlayStep(query.message.chat.id, query.message.message_id, data, bot, bank);
        return;
    }

    if (data === "game_quit") {
        bot.editMessageText("You sure you want to quit?\n"+
            "You will not get your money back\n"+
            "and the progress will be terminated.", {
                chat_id: chatId,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{text:"I want to keep GAMBLING!", callback_data:"keep_playing_laby"}],
                        [{text:"Quit anyway", callback_data:"main_menu"}]
                    ]
                }
            });
        return;
    }

    if (data === "keep_playing_laby") {
        gameLabyrinth.gameContinueStep(chatId, query.message.message_id, bot, bank);
        return;
    }

    if (data === "stop_bot") {
        await bot.deleteMessage(query.message.chat.id, query.message.message_id);
        await bot.sendMessage(query.message.chat.id, "Type /start to start again");
    }

});

bot.onText(/\/echo (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | any) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    await bot.sendMessage(chatId, resp);
});

bot.on("polling_error", (err) => console.error("[Polling Error]", err));

/*
bot.on('message', (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `Message "${msg.text}" received!`);
});
*/