import fs from "fs";
import { dir } from "console";
import { randomInt } from "crypto";
import TelegramBot from "node-telegram-bot-api";
import { text } from "stream/consumers";

const token: string = fs.readFileSync("botToken.txt", "utf8").trim();

const bot = new TelegramBot(token, {polling: true});

import { GameLabyrinth } from "./labyrinth";
const gameLabyrinth = new GameLabyrinth();

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "You started the bot!\n--- MAIN MENU ---", {
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

bot.on("callback_query", (query: any) => {
    bot.answerCallbackQuery(query.id);

    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "main_menu") {
        bot.editMessageText(`--- MAIN MENU ---`, {
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

    if (data === "game_labyrinth") {
        gameLabyrinth.StartGame(query.message.chat.id, query.message.message_id, bot);
    }

    if (data.startsWith("laby_")) {
        gameLabyrinth.gamePlayStep(query.message.chat.id, query.message.message_id, data, bot);
    }

    if (data === "stop_bot") {
        bot.deleteMessage(query.message.chat.id, query.message.message_id);
        bot.sendMessage(query.message.chat.id, "Type /start to start again");
    }

});

bot.onText(/\/echo (.+)/, (msg: TelegramBot.Message, match: RegExpExecArray | any) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    bot.sendMessage(chatId, resp);
});

bot.on("polling_error", (err) => console.error("[Polling Error]", err));

/*
bot.on('message', (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `Message "${msg.text}" received!`);
});
*/