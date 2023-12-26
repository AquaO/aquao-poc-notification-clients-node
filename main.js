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
const express = require('express');
const bodyParser = require('body-parser');
const restServer = express({type: "application/json"});

// Debug
restServer.use(function (request, response, next) {
    console.debug(`Incoming request :  ${request.path}`);
    next();
});

// Intercept the raw body
restServer.use(bodyParser.json({
    verify: (request, response, buffer) => {
        request.rawBody = buffer;
    }
}));

// Routes
restServer.post(process.env.SERVER_ENDPOINT_BASE + '/client/created', (request, response) => {
    onClientNotification(request, response, 'CREATED');
});

restServer.post(process.env.SERVER_ENDPOINT_BASE + '/client/updated', (request, response) => {
    onClientNotification(request, response, 'UPDATED');
});

restServer.post(process.env.SERVER_ENDPOINT_BASE + '/client/deleted', (request, response) => {
    onClientNotification(request, response, 'DELETED');
});

restServer.post(process.env.SERVER_ENDPOINT_BASE + '/client/anonymized', (request, response) => {
    onClientNotification(request, response, 'ANONYMIZED');
});

/**
 * Run the whole thing
 */
restServer.listen(process.env.SERVER_PORT, () => {
    console.log("Server running on port " + process.env.SERVER_PORT);
});

// ------------- CONTROLLERS -------------------------------------------
/**
 * 
 * @param {ExpressRequest} request 
 * @param {ExpressResponse} request 
 * @param {string} status 
 */
function onClientNotification(request, response, status){
    
    let uid = request.headers['x-aquao-notification-uid'];
    let signature = request.headers['x-aquao-notification-sign'];

    try{
        checkSignature(request.rawBody, signature);
        let client = request.body;
        console.log(`SUCCESS ${status} notification for client '${client.code}'`);
    } catch(e){
        console.log(`FAILED ${status} notification : ${e.message}`);
    }

    response.status(204).send();
}


// ------------- LIB -------------------------------------------

/**
 * 
 * @param {Buffer} data 
 * @param {string} signature 
 * @returns 
 */
function checkSignature(data, signature){

    if(signature == undefined){
        throw new Error(`Bad headers signature (${signature})`);
    }

    let computed = crypto.createHmac('sha256', __secret).update(data).digest("base64");

    if(computed != signature){
        throw new Error(`Bad signature '${signature}' from computed '${computed}'`);
    }

    return true;
}
