import { FastifyInstance } from 'fastify';
import { recommendFriends, recommendFriendsSchema } from '../controllers/recommendations/friends';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.post('/friends', { schema: { body: recommendFriendsSchema } }, recommendFriends);

  done();
}