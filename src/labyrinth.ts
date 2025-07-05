import { randomInt } from "crypto";
import TelegramBot from "node-telegram-bot-api";

export class GameLabyrinth {
    // chatId -> {maze path and current step}
    private userLabyGameState = new Map<number, {path: string[], currentStep: number}>();

    public StartGame(chatId: number, messageId: number, bot: TelegramBot) {
        const directions = ["⬅️", "⬆️", "➡️"];
        const path: Array<string> = [];

        let lastDirection = directions[randomInt(3)];
        path.push(lastDirection);

        for (let i = 1; i < 3; ++i) {
            const availableDirections = directions.filter(d => d !== lastDirection);
            lastDirection = availableDirections[randomInt(2)];
            path.push(lastDirection);
        }
 
        this.userLabyGameState.set(chatId, {path, currentStep:0});

        bot.editMessageText(`GAME LABYRINTH ꡙ‍ꡌ‍`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text:"Choose the direction:", callback_data:"none"},
                    ],
                    [
                        {text:"⬅️", callback_data:"laby_left", },
                        {text:"⬆️", callback_data:"laby_forward"},
                        {text:"➡️", callback_data:"laby_right"},
                    ],
                    [
                        {text:"Quit", callback_data:"main_menu"},
                    ],
                ]
            }
        });
    }

    public gamePlayStep(chatId: number, messageId: number, data: string, bot: TelegramBot) {
        const userState = this.userLabyGameState.get(chatId);
        if (!userState) {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, "Pls, start a game before playing. /start");
            return;
        }

        const stepChoice = 
            data === "laby_left" ? '⬅️' :
            data === "laby_forward" ? '⬆️' :
            '➡️';

        if (stepChoice === userState.path[userState.currentStep]) {
            userState.currentStep++;
            let currentPath = "";
            for (let i=0; i<userState.currentStep; ++i) currentPath+=userState.path[i];
            if (userState.currentStep == 3) {
                bot.editMessageText(`${currentPath}\nYOU FOUND THE WAY!\nCONGRATULATIONS!!`, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{text:"New game", callback_data:"game_labyrinth"}],
                            [{text:"Quit", callback_data:"main_menu"}],
                        ]
                    }
                });
                this.userLabyGameState.delete(chatId);
                return;
            }
            const directions = [["⬅️", "laby_left"], ["⬆️","laby_forward"], ["➡️","laby_right"]];
            let btn1 = (stepChoice === "⬅️" ? 1 : 0);
            let btn2 = (stepChoice === "⬆️" || btn1 === 1 ? 2 : 1);
            bot.editMessageText(`Correct!!\nLABYRINTH ꡙ‍ꡌ‍ ${currentPath}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text:"Choose the direction:", callback_data:"none"},
                        ],
                        [
                            {text:directions[btn1][0], callback_data:directions[btn1][1]},
                            {text:directions[btn2][0], callback_data:directions[btn2][1]},
                        ],
                        [
                            {text:"Quit", callback_data:"main_menu"},
                        ],
                    ]
                }
            });
        }
        else {
            bot.editMessageText(`WROONGG!\nYOU DIDN'T FIND IT!!\nCorrect way: ${userState.path.join("")}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{text:"New game", callback_data:"game_labyrinth"}],
                        [{text:"Quit", callback_data:"main_menu"}],
                    ]
                }
            });
            this.userLabyGameState.delete(chatId);
            return; 
        }
    }
}