import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import creatError from 'http-errors';
import { getAuctionById } from './getAuction';
import createHttpError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {

    const { id } = event.pathParameters;
    const { amount } = event.body;

    const auction = await getAuctionById(id);

    if (amount <= auction.highestBid.amount){
        throw new createHttpError.Forbidden(`Your bid must higher than ${auction.highestBid.amount}!`);

    }

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount',
        ExpressionAttributeValues:{
            ':amount': amount,
        },
        ReturnValues: 'ALL_NEW',
    };

    let updateAuction;
    try {
        const result = await dynamodb.update(params).promise();
        updateAuction = result.Attributes;

    } catch (error) {
        console.error(error);
        throw new creatError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updateAuction),
    };
}

export const handler = commonMiddleware(placeBid);


