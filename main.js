/**
 * BSD Zero Clause License
 * Copyright (C) 2023 by AquaO support@aquao.fr
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING 
 * ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, 
 * DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, 
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE 
 * OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Environment
 */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env" : `.env.${process.env.NODE_ENV}`
});

/**
 * Crypto
 */
const crypto = require('crypto');
const __secret = Buffer.from(process.env.NOTIFICATION_SECRET, 'base64');

/**
 * Rest server
 */
const restServer = require('node-rest-server')

// Server config
const serverConfig = {
    basePath: process.env.SERVER_ENDPOINT_BASE,
    port: parseInt(process.env.SERVER_PORT),
    delay: 1,
    logger: {
        enable: true,
        debug: false,
    },
    cors: {
        origin: "*",
    },
};

// Route config
const routeConfig = {
	'/client/created': {
		method: 'POST',
		status: 203,
		header: {},
		controller: (request) => onNotifyClient(request, 'CREATED'),
	},
	'/client/updated': {
		method: 'POST',
		status: 203,
		header: {},
		controller: (request) => onNotifyClient(request, 'UPDATED'),
	},
	'/client/deleted': {
		method: 'POST',
		status: 203,
		header: {},
		controller: (request) => onNotifyClient(request, 'DELETED'),
	},
	'/client/anonymized': {
		method: 'POST',
		status: 203,
		header: {},
		controller: (request) => onNotifyClient(request, 'ANONYMIZED'),
	}
};

/**
 * Run the whole thing
 */
restServer(routeConfig, serverConfig);

// ------------- CONTROLLERS -------------------------------------------
/**
 * 
 * @param {ExpressRequest} request 
 * @param {string} status 
 */
function onNotifyClient(request, status){
    
    let uid = request.headers['x-aquao-notification-uid'];
    let signature = request.headers['x-aquao-notification-sign'];

    try{
        checkSignature(uid, signature);
        let client = request.body;
        console.log(`SUCCESS ${status} notification for client '${client.code}'`);
    } catch(e){
        console.log(`FAILED ${status} notification : ${e.message}`);
    }

}


// ------------- LIB -------------------------------------------

/**
 * 
 * @param {string} uid 
 * @param {string} signature 
 * @returns 
 */
function checkSignature(uid, signature){

    if(uid == undefined || signature == undefined){
        throw new Error(`Bad headers uid (${uid}) or signature (${signature})`);
    }

    let computed = crypto.createHmac('sha256', __secret).update(uid).digest("base64");

    if(computed != signature){
        throw new Error(`Bad signature '${signature}' from computed '${computed}'`);
    }

    return true;
}
