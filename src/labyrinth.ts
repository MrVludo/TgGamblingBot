import { randomInt } from "crypto";
import TelegramBot from "node-telegram-bot-api";
import { Bank } from "./bank";

const GAMEPRICE = 10;
const WINPOT = 100;

export class GameLabyrinth {
    // chatId -> {maze path and current step}
    private userLabyGameState = new Map<number, {path: string[], currentStep: number}>();

    public async StartGame(chatId: number, messageId: number, bot: TelegramBot, bank: Bank) {
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

    public async gameContinueStep(chatId: number, messageId: number, bot: TelegramBot, bank: Bank) { 
        const userState = this.userLabyGameState.get(chatId);
        if (!userState) {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, "Pls, start a game before playing. /start");
            return;
        }
        if (!userState.currentStep) {
            return this.StartGame(chatId, messageId, bot, bank);
        } 
        userState.currentStep--;
        this.userLabyGameState.set(chatId, userState);
        const data = userState.path[userState.currentStep];
        return this.gamePlayStep(chatId, messageId, data, bot, bank);
    }

    public async gamePlayStep(chatId: number, messageId: number, data: string, bot: TelegramBot, bank: Bank) {
        const userState = this.userLabyGameState.get(chatId);
        if (!userState) {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, "Pls, start a game before playing. /start");
            return;
        }
        if (userState.currentStep == 0) {
            let userBalance = await bank.getBalance(chatId);
            if (userBalance < GAMEPRICE) {
                bot.editMessageText(`🔔 YOU ARE TOO BROKE! THE GAME COSTS ${GAMEPRICE} 💠\nBalance: *${userBalance}* 💠`, {
                    parse_mode: 'Markdown',
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{text:"Top up balance and keep GAMBLING", callback_data:"deposit"}],
                            [{text:"Quit", callback_data:"main_menu"}]
                        ]
                    }
                });
                return;
            }
            userBalance -= GAMEPRICE;
            await bank.setBalance(chatId, userBalance);
        }

        const stepChoice = 
            data === "⬅️" ? '⬅️' :
            data === "⬆️" ? '⬆️' :
            data === "➡️" ? '➡️' :
            data === "laby_left" ? '⬅️' :
            data === "laby_forward" ? '⬆️' :
            '➡️';
        // console.log(data); console.log(stepChoice);

        if (stepChoice === userState.path[userState.currentStep]) {
            userState.currentStep++;
            let currentPath = "";
            for (let i=0; i<userState.currentStep; ++i) currentPath+=userState.path[i];
            if (userState.currentStep == 3) {
                await bank.changeBalance(chatId, +WINPOT);
                const userBalance = await bank.getBalance(chatId);
                bot.editMessageText(`${currentPath}\nYOU FOUND THE WAY!\nCONGRATULATIONS!!\nBalance: *${userBalance}* 💠`, {
                    parse_mode: 'Markdown',
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
                parse_mode: 'Markdown',
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
                            {text:"Quit", callback_data:"game_quit"},
                        ],
                    ]
                }
            });
        }
        else {
            const userBalance = await bank.getBalance(chatId)
            bot.editMessageText(`WROONGG!\nYOU DIDN'T FIND IT!!\nCorrect way: ${userState.path.join("")}\nBalance: *${userBalance}* 💠`, {
                parse_mode: 'Markdown',
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{text:"New game", callback_data:"game_labyrinth"}],
                        [{text:"Quit", callback_data:"main_menu"}],
                    ]
                }
            });
            // this.userLabyGameState.delete(chatId);
            return; 
        }
    }
}